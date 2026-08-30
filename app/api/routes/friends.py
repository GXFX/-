"""
Поиск по юзерам + заявки в друзья.

ВАЖНО: путь app.api.deps (get_db / get_current_user) — всё ещё
предположение, я его не видел. Если при рестарте будет новый
ImportError на этой строке — пришли мне файл роутов, где уже
используются get_db/get_current_user (например meetups.py из
app/api/routes/), и я поправлю.
"""
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_db  # <-- проверить путь!
from app.models.friendship import FriendRequest
from app.models.user import User
from app.schemas.friendship import (
    FriendRequestActionResult,
    FriendRequestOut,
    UserSearchResult,
)
from app.schemas.user import UserPublic

router = APIRouter(tags=["friends"])


async def _get_relationship(
    db: AsyncSession, user_a_id: uuid.UUID, user_b_id: uuid.UUID
) -> FriendRequest | None:
    result = await db.execute(
        select(FriendRequest).where(
            or_(
                and_(
                    FriendRequest.requester_id == user_a_id,
                    FriendRequest.addressee_id == user_b_id,
                ),
                and_(
                    FriendRequest.requester_id == user_b_id,
                    FriendRequest.addressee_id == user_a_id,
                ),
            )
        )
    )
    return result.scalar_one_or_none()


def _relation_status_for(rel: FriendRequest | None, current_user_id: uuid.UUID) -> str:
    if rel is None or rel.status == "declined":
        return "none"
    if rel.status == "accepted":
        return "friends"
    if rel.requester_id == current_user_id:
        return "request_sent"
    return "request_received"


@router.get("/users/search", response_model=list[UserSearchResult])
async def search_users(
    q: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = q.strip()
    if len(query) < 2:
        return []

    result = await db.execute(
        select(User)
        .where(
            User.id != current_user.id,
            or_(User.name.ilike(f"%{query}%"), User.username.ilike(f"%{query}%")),
        )
        .limit(20)
    )
    users = result.scalars().all()

    out: List[UserSearchResult] = []
    for u in users:
        rel = await _get_relationship(db, current_user.id, u.id)
        status_str = _relation_status_for(rel, current_user.id)
        out.append(
            UserSearchResult(
                id=u.id,
                name=u.name,
                username=u.username,
                photo_url=getattr(u, "photo_url", None),
                relation_status=status_str,
                request_id=rel.id if rel and status_str.startswith("request_") else None,
            )
        )
    return out


@router.post("/users/{user_id}/friend-requests", response_model=FriendRequestActionResult)
async def send_friend_request(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нельзя добавить себя в друзья",
        )

    other = await db.get(User, user_id)
    if other is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден",
        )

    rel = await _get_relationship(db, current_user.id, user_id)

    if rel and rel.status == "accepted":
        return FriendRequestActionResult(relation_status="friends")

    if rel and rel.status == "pending":
        if rel.requester_id == current_user.id:
            return FriendRequestActionResult(relation_status="request_sent", request_id=rel.id)
        rel.status = "accepted"
        rel.responded_at = datetime.utcnow()
        await db.commit()
        return FriendRequestActionResult(relation_status="friends")

    if rel and rel.status == "declined":
        rel.status = "pending"
        rel.requester_id = current_user.id
        rel.addressee_id = user_id
        rel.responded_at = None
        await db.commit()
        return FriendRequestActionResult(relation_status="request_sent", request_id=rel.id)

    new_req = FriendRequest(
        requester_id=current_user.id, addressee_id=user_id, status="pending"
    )
    db.add(new_req)
    await db.commit()
    await db.refresh(new_req)
    return FriendRequestActionResult(relation_status="request_sent", request_id=new_req.id)


@router.get("/friend-requests/incoming", response_model=list[FriendRequestOut])
async def get_incoming_requests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(FriendRequest)
        .options(selectinload(FriendRequest.requester))
        .where(
            FriendRequest.addressee_id == current_user.id,
            FriendRequest.status == "pending",
        )
        .order_by(FriendRequest.created_at.desc())
    )
    return result.scalars().all()


async def _get_owned_incoming_request(
    db: AsyncSession, request_id: uuid.UUID, current_user_id: uuid.UUID
) -> FriendRequest:
    req = await db.get(FriendRequest, request_id)
    if req is None or req.addressee_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Заявка не найдена"
        )
    return req


@router.post(
    "/friend-requests/{request_id}/accept", response_model=FriendRequestActionResult
)
async def accept_friend_request(
    request_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    req = await _get_owned_incoming_request(db, request_id, current_user.id)
    req.status = "accepted"
    req.responded_at = datetime.utcnow()
    await db.commit()
    return FriendRequestActionResult(relation_status="friends")


@router.post(
    "/friend-requests/{request_id}/decline", response_model=FriendRequestActionResult
)
async def decline_friend_request(
    request_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    req = await _get_owned_incoming_request(db, request_id, current_user.id)
    req.status = "declined"
    req.responded_at = datetime.utcnow()
    await db.commit()
    return FriendRequestActionResult(relation_status="none")


@router.get("/users/me/friends", response_model=list[UserPublic])
async def get_my_friends(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(FriendRequest).where(
            FriendRequest.status == "accepted",
            or_(
                FriendRequest.requester_id == current_user.id,
                FriendRequest.addressee_id == current_user.id,
            ),
        )
    )
    rels = result.scalars().all()
    friend_ids = [
        r.addressee_id if r.requester_id == current_user.id else r.requester_id
        for r in rels
    ]
    if not friend_ids:
        return []

    result2 = await db.execute(select(User).where(User.id.in_(friend_ids)))
    return result2.scalars().all()
