import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy.orm import aliased

from app.api.deps import get_current_user
from app.database import get_db
from app.models.chat import Chat, ChatParticipant, Message
from app.models.friendship import FriendRequest
from app.models.meetup import Meetup, MeetupParticipant
from app.models.user import User
from app.core.push_service import send_push_to_user
from app.schemas.chat import ChatSummary, MessageResponse, SendMessageRequest

router = APIRouter(prefix="/chats", tags=["chats"])


@router.get("", response_model=list[ChatSummary])
async def get_chats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Chat)
        .join(ChatParticipant, ChatParticipant.chat_id == Chat.id)
        .where(
            ChatParticipant.user_id == current_user.id,
            ChatParticipant.hidden_at.is_(None),
        )
    )
    chats = result.scalars().unique().all()

    my_participant_result = await db.execute(
        select(ChatParticipant).where(ChatParticipant.user_id == current_user.id)
    )
    my_participants = {p.chat_id: p for p in my_participant_result.scalars().all()}

    summaries = []
    for chat in chats:
        last_msg_result = await db.execute(
            select(Message)
            .where(Message.chat_id == chat.id)
            .order_by(Message.created_at.desc())
            .limit(1)
        )
        last_message = last_msg_result.scalar_one_or_none()

        my_participant = my_participants.get(chat.id)
        last_read_at = my_participant.last_read_at if my_participant else None
        if last_read_at is None:
            unread_count_result = await db.execute(
                select(func.count(Message.id)).where(
                    Message.chat_id == chat.id, Message.sender_id != current_user.id
                )
            )
        else:
            unread_count_result = await db.execute(
                select(func.count(Message.id)).where(
                    Message.chat_id == chat.id,
                    Message.sender_id != current_user.id,
                    Message.created_at > last_read_at,
                )
            )
        unread_count = unread_count_result.scalar_one()

        title = None
        other_user = None
        if chat.is_private:
            other_result = await db.execute(
                select(User)
                .join(ChatParticipant, ChatParticipant.user_id == User.id)
                .where(ChatParticipant.chat_id == chat.id, User.id != current_user.id)
            )
            other_user = other_result.scalar_one_or_none()
            title = other_user.name if other_user else "Личный чат"
        elif chat.meetup_id:
            meetup_result = await db.execute(select(Meetup).where(Meetup.id == chat.meetup_id))
            meetup = meetup_result.scalar_one_or_none()
            title = meetup.title if meetup and meetup.title else "Чат встречи"

        summaries.append(
            ChatSummary(
                id=chat.id,
                meetup_id=chat.meetup_id,
                is_private=chat.is_private,
                title=title,
                last_message=last_message.content if last_message else None,
                last_message_at=last_message.created_at if last_message else None,
                other_user=other_user,
                unread_count=unread_count,
            )
        )

    def _sort_key(c):
        if c.last_message_at is None:
            return 0.0
        try:
            return c.last_message_at.timestamp()
        except Exception:
            return 0.0

    summaries.sort(key=_sort_key, reverse=True)
    return summaries


async def _ensure_participant(db: AsyncSession, chat_id: uuid.UUID, user_id: uuid.UUID):
    result = await db.execute(
        select(ChatParticipant).where(
            ChatParticipant.chat_id == chat_id, ChatParticipant.user_id == user_id
        )
    )
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=403, detail="Вы не участник этого чата")
@router.post("/{chat_id}/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_chat_read(
    chat_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ChatParticipant).where(
            ChatParticipant.chat_id == chat_id, ChatParticipant.user_id == current_user.id
        )
    )
    participant = result.scalar_one_or_none()
    if participant is None:
        raise HTTPException(status_code=403, detail="Вы не участник этого чата")

    participant.last_read_at = datetime.now()
    await db.commit()

@router.delete("/{chat_id}", status_code=status.HTTP_204_NO_CONTENT)
async def hide_chat(
    chat_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ChatParticipant).where(
            ChatParticipant.chat_id == chat_id, ChatParticipant.user_id == current_user.id
        )
    )
    participant = result.scalar_one_or_none()
    if participant is None:
        raise HTTPException(status_code=403, detail="Вы не участник этого чата")

    participant.hidden_at = datetime.now()
    await db.commit()

@router.get("/{chat_id}/messages", response_model=list[MessageResponse])
async def get_chat_messages(
    chat_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _ensure_participant(db, chat_id, current_user.id)

    result = await db.execute(
        select(Message, User)
        .outerjoin(User, User.id == Message.sender_id)
        .where(Message.chat_id == chat_id)
        .order_by(Message.created_at.asc())
    )
    rows = result.all()

    others_result = await db.execute(
        select(ChatParticipant.last_read_at).where(
            ChatParticipant.chat_id == chat_id,
            ChatParticipant.user_id != current_user.id,
            ChatParticipant.last_read_at.is_not(None),
        )
    )
    other_read_times = [r for r in others_result.scalars().all() if r is not None]
    latest_other_read = max(other_read_times) if other_read_times else None

    return [
        MessageResponse(
            id=msg.id,
            chat_id=msg.chat_id,
            sender_id=msg.sender_id,
            sender=sender,
            content=msg.content,
            photo_url=msg.photo_url,
            message_type=msg.message_type,
            created_at=msg.created_at,
            is_read=bool(latest_other_read and msg.created_at <= latest_other_read),
        )
        for msg, sender in rows
    ]


@router.post("/{chat_id}/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    chat_id: uuid.UUID,
    payload: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _ensure_participant(db, chat_id, current_user.id)

    content = payload.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Сообщение не может быть пустым")

    message = Message(
        chat_id=chat_id,
        sender_id=current_user.id,
        content=content,
        message_type="text",
    )
    db.add(message)

    other_participants_result = await db.execute(
        select(ChatParticipant).where(
            ChatParticipant.chat_id == chat_id,
            ChatParticipant.user_id != current_user.id,
        )
    )
    other_participants = other_participants_result.scalars().all()
    for participant in other_participants:
        if participant.hidden_at is not None:
            participant.hidden_at = None

    await db.commit()
    await db.refresh(message)

    for participant in other_participants:
        await send_push_to_user(
            db,
            participant.user_id,
            title=current_user.name,
            body=content[:120],
            url="/",
        )

    return MessageResponse(
        id=message.id,
        chat_id=message.chat_id,
        sender_id=message.sender_id,
        sender=current_user,
        content=message.content,
        photo_url=message.photo_url,
        message_type=message.message_type,
        created_at=message.created_at,
    )

async def _can_message(db: AsyncSession, current_user_id: uuid.UUID, target: User) -> bool:
    if target.privacy_messaging == "everyone":
        return True

    if target.privacy_messaging == "nobody":
        return False

    if target.privacy_messaging == "shared_meetups":
        MP1 = aliased(MeetupParticipant)
        MP2 = aliased(MeetupParticipant)
        result = await db.execute(
            select(MP1.meetup_id)
            .join(MP2, MP1.meetup_id == MP2.meetup_id)
            .where(MP1.user_id == current_user_id, MP2.user_id == target.id)
            .limit(1)
        )
        return result.scalar_one_or_none() is not None

    if target.privacy_messaging == "requests_only":
        result = await db.execute(
            select(FriendRequest).where(
                FriendRequest.status == "accepted",
                or_(
                    and_(
                        FriendRequest.requester_id == current_user_id,
                        FriendRequest.addressee_id == target.id,
                    ),
                    and_(
                        FriendRequest.requester_id == target.id,
                        FriendRequest.addressee_id == current_user_id,
                    ),
                ),
            )
        )
        return result.scalar_one_or_none() is not None

    return True
@router.post("/direct/{user_id}", response_model=ChatSummary, status_code=status.HTTP_201_CREATED)
async def get_or_create_direct_chat(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Нельзя создать чат с самим собой")

    other_user = await db.get(User, user_id)
    if other_user is None:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    result = await db.execute(
        select(Chat.id)
        .join(ChatParticipant, ChatParticipant.chat_id == Chat.id)
        .where(Chat.is_private.is_(True), ChatParticipant.user_id.in_([current_user.id, user_id]))
        .group_by(Chat.id)
        .having(func.count(func.distinct(ChatParticipant.user_id)) == 2)
    )
    chat_id = result.scalar_one_or_none()

    if chat_id is None:
        if not await _can_message(db, current_user.id, other_user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Этот пользователь ограничил, кто может писать ему первым",
            )
        chat = Chat(meetup_id=None, is_private=True)
        db.add(chat)
        await db.flush()
        db.add(ChatParticipant(chat_id=chat.id, user_id=current_user.id))
        db.add(ChatParticipant(chat_id=chat.id, user_id=user_id))
        await db.commit()
        chat_id = chat.id

    return ChatSummary(
        id=chat_id,
        meetup_id=None,
        is_private=True,
        title=other_user.name,
        last_message=None,
        last_message_at=None,
        other_user=other_user,
    )