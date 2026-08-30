import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from geoalchemy2 import Geometry, WKTElement
from geoalchemy2 import functions as geo_func
from geoalchemy2.shape import to_shape
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_current_user_optional
from app.database import get_db
from app.models.chat import Chat, ChatParticipant, Message
from app.models.meetup import JoinRequest, Meetup, MeetupParticipant
from app.models.user import User
from app.schemas.meetup import (
    JoinRequestResponse,
    MeetupCreateRequest,
    MeetupDetail,
    MeetupSummary,
    MeetupUpdateRequest,
)

MYTISHCHI_BOUNDS = {
    "min_lat": 55.85,
    "max_lat": 56.17,
    "min_lng": 37.43,
    "max_lng": 37.87,
}


def _is_within_active_zone(lat: float, lng: float) -> bool:
    return (
        MYTISHCHI_BOUNDS["min_lat"] <= lat <= MYTISHCHI_BOUNDS["max_lat"]
        and MYTISHCHI_BOUNDS["min_lng"] <= lng <= MYTISHCHI_BOUNDS["max_lng"]
    )
router = APIRouter(prefix="/meetups", tags=["meetups"])


def _make_point(lat: float, lng: float) -> WKTElement:
    return WKTElement(f"POINT({lng} {lat})", srid=4326, extended=True)
COORD_GRID = 0.005  # ~500m — размер "примерного района" для непринятых участников

def _mask_coords(lat: float, lng: float) -> tuple[float, float]:
    return (
        round(lat / COORD_GRID) * COORD_GRID,
        round(lng / COORD_GRID) * COORD_GRID,
    )


async def _can_see_exact_location(db: AsyncSession, meetup_id: uuid.UUID, meetup_creator_id: uuid.UUID, user: User | None) -> bool:
    if user is None:
        return False
    if user.id == meetup_creator_id:
        return True
    result = await db.execute(
        select(MeetupParticipant).where(
            MeetupParticipant.meetup_id == meetup_id,
            MeetupParticipant.user_id == user.id,
            MeetupParticipant.status == "active",
        )
    )
    return result.scalar_one_or_none() is not None

@router.post("", response_model=MeetupDetail, status_code=status.HTTP_201_CREATED)
async def create_meetup(
    payload: MeetupCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):

    if current_user.city_id is None:
        raise HTTPException(status_code=400, detail="Set your city before creating a meetup")
    if not _is_within_active_zone(payload.latitude, payload.longitude):
        raise HTTPException(status_code=400, detail="Meetups can only be created within the active zone (Mytishchi)")

    # Meetups always auto-close 3 hours after start_time.
    computed_end_time = payload.start_time + timedelta(hours=3)

    meetup = Meetup(
        creator_id=current_user.id,
        city_id=current_user.city_id,
        title=payload.title,
        description=payload.description,
        activity_type=payload.activity_type,
        place_name=payload.place_name,
        location=_make_point(payload.latitude, payload.longitude),
        start_time=payload.start_time,
        end_time=computed_end_time,
        max_participants=payload.max_participants,
        min_age=payload.min_age,
        max_age=payload.max_age,
        visibility=payload.visibility,
    )
    db.add(meetup)
    await db.flush()

    db.add(MeetupParticipant(meetup_id=meetup.id, user_id=current_user.id))

    chat = Chat(meetup_id=meetup.id, is_private=False)
    db.add(chat)
    await db.flush()
    db.add(ChatParticipant(chat_id=chat.id, user_id=current_user.id))

    await db.commit()
    return await _load_meetup_detail(db, meetup.id)


@router.get("", response_model=list[MeetupSummary])
async def search_meetups(
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
    radius_km: float = Query(5.0, gt=0, le=50),
    activity_type: str | None = None,
    current_user: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    origin = _make_point(lat, lng)
    distance_expr = geo_func.ST_Distance(Meetup.location, origin)

    participant_count_subq = (
        select(func.count(MeetupParticipant.user_id))
        .where(MeetupParticipant.meetup_id == Meetup.id, MeetupParticipant.status == "active")
        .scalar_subquery()
    )

    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)

    # Sort key: meetups that haven't started yet come first, already
    # started ones sink to the bottom. Within each group, sort by
    # distance (closest first) — same as before.
    has_started_expr = case((Meetup.start_time <= now, 1), else_=0)

    stmt = (
        select(Meetup, distance_expr.label("distance_m"), participant_count_subq.label("participant_count"))
        .where(
            Meetup.status == "active",
            Meetup.end_time > now,
            geo_func.ST_DWithin(Meetup.location, origin, radius_km * 1000),
        )
        .order_by(has_started_expr, distance_expr)
    )
    if activity_type:
        stmt = stmt.where(Meetup.activity_type == activity_type)

    result = await db.execute(stmt)
    rows = result.all()

    result_list = []
    for meetup, distance_m, participant_count in rows:
        point = to_shape(meetup.location)
        can_see_exact = await _can_see_exact_location(db, meetup.id, meetup.creator_id, current_user)
        out_lat, out_lng = (point.y, point.x) if can_see_exact else _mask_coords(point.y, point.x)
        result_list.append(
            MeetupSummary(
                id=meetup.id,
                title=meetup.title,
                activity_type=meetup.activity_type,
                place_name=meetup.place_name,
                start_time=meetup.start_time,
                status=meetup.status,
                participant_count=participant_count,
                distance_km=round(distance_m / 1000, 2),
                latitude=out_lat,
                longitude=out_lng,
            )
        )
    return result_list


async def _load_meetup_detail(db: AsyncSession, meetup_id: uuid.UUID, current_user: User | None = None) -> MeetupDetail:
    stmt = select(Meetup).where(Meetup.id == meetup_id)
    result = await db.execute(stmt)
    meetup = result.scalar_one_or_none()
    if meetup is None:
        raise HTTPException(status_code=404, detail="Meetup not found")

    coords_result = await db.execute(
        select(
            geo_func.ST_Y(Meetup.location.cast(Geometry)),
            geo_func.ST_X(Meetup.location.cast(Geometry)),
        ).where(Meetup.id == meetup_id)
    )
    lat, lng = coords_result.one()

    creator_result = await db.execute(select(User).where(User.id == meetup.creator_id))
    creator = creator_result.scalar_one()

    participants_result = await db.execute(
        select(User)
        .join(MeetupParticipant, MeetupParticipant.user_id == User.id)
        .where(MeetupParticipant.meetup_id == meetup_id, MeetupParticipant.status == "active")
    )
    participants = participants_result.scalars().all()

    chat_result = await db.execute(
        select(Chat.id).where(Chat.meetup_id == meetup.id, Chat.is_private.is_(False))
    )
    group_chat_id = chat_result.scalar_one_or_none()

    can_see_exact = await _can_see_exact_location(db, meetup.id, meetup.creator_id, current_user)
    out_lat, out_lng = (lat, lng) if can_see_exact else _mask_coords(lat, lng)

    return MeetupDetail(
        id=meetup.id,
        title=meetup.title,
        description=meetup.description,
        activity_type=meetup.activity_type,
        place_name=meetup.place_name,
        start_time=meetup.start_time,
        end_time=meetup.end_time,
        status=meetup.status,
        max_participants=meetup.max_participants,
        participant_count=len(participants),
        creator=creator,
        participants=list(participants),
        latitude=out_lat,
        longitude=out_lng,
        chat_id=group_chat_id,
    )


@router.get("/{meetup_id}", response_model=MeetupDetail)
async def get_meetup(
    meetup_id: uuid.UUID,
    current_user: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    return await _load_meetup_detail(db, meetup_id, current_user)


@router.put("/{meetup_id}", response_model=MeetupDetail)
async def update_meetup(
    meetup_id: uuid.UUID,
    payload: MeetupUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Meetup).where(Meetup.id == meetup_id))
    meetup = result.scalar_one_or_none()
    if meetup is None:
        raise HTTPException(status_code=404, detail="Meetup not found")
    if meetup.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the organizer can edit this meetup")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(meetup, field, value)
    await db.commit()
    return await _load_meetup_detail(db, meetup_id)


@router.delete("/{meetup_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_meetup(
    meetup_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Meetup).where(Meetup.id == meetup_id))
    meetup = result.scalar_one_or_none()
    if meetup is None:
        raise HTTPException(status_code=404, detail="Meetup not found")
    if meetup.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the organizer can cancel this meetup")
    meetup.status = "cancelled"
    await db.commit()


@router.delete("/{meetup_id}/participants/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_participant(
    meetup_id: uuid.UUID,
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    meetup_result = await db.execute(select(Meetup).where(Meetup.id == meetup_id))
    meetup = meetup_result.scalar_one_or_none()
    if meetup is None:
        raise HTTPException(status_code=404, detail="Meetup not found")
    if meetup.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the organizer can remove participants")
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Organizer cannot remove themselves")

    result = await db.execute(
        select(MeetupParticipant).where(
            MeetupParticipant.meetup_id == meetup_id,
            MeetupParticipant.user_id == user_id,
        )
    )
    participant = result.scalar_one_or_none()
    if participant is None:
        raise HTTPException(status_code=404, detail="Participant not found")

    participant.status = "removed"

    chat_result = await db.execute(select(Chat).where(Chat.meetup_id == meetup_id))
    chat = chat_result.scalar_one_or_none()
    if chat is not None:
        chat_participant_result = await db.execute(
            select(ChatParticipant).where(
                ChatParticipant.chat_id == chat.id, ChatParticipant.user_id == user_id
            )
        )
        chat_participant = chat_participant_result.scalar_one_or_none()
        if chat_participant is not None:
            await db.delete(chat_participant)

    await db.commit()


@router.get("/{meetup_id}/requests", response_model=list[JoinRequestResponse])
async def list_join_requests(
    meetup_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    meetup_result = await db.execute(select(Meetup).where(Meetup.id == meetup_id))
    meetup = meetup_result.scalar_one_or_none()
    if meetup is None:
        raise HTTPException(status_code=404, detail="Meetup not found")
    if meetup.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the organizer can view requests")

    result = await db.execute(
        select(JoinRequest, User)
        .join(User, User.id == JoinRequest.user_id)
        .where(JoinRequest.meetup_id == meetup_id, JoinRequest.status == "pending")
    )
    rows = result.all()
    return [
        JoinRequestResponse(
            id=jr.id,
            meetup_id=jr.meetup_id,
            user_id=jr.user_id,
            user=user,
            status=jr.status,
            created_at=jr.created_at,
        )
        for jr, user in rows
    ]
@router.get("/{meetup_id}/my-request", response_model=JoinRequestResponse | None)
async def get_my_join_request(
    meetup_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(JoinRequest, User)
        .join(User, User.id == JoinRequest.user_id)
        .where(JoinRequest.meetup_id == meetup_id, JoinRequest.user_id == current_user.id)
        .order_by(JoinRequest.created_at.desc())
    )
    row = result.first()
    if row is None:
        return None
    jr, user = row
    return JoinRequestResponse(
        id=jr.id,
        meetup_id=jr.meetup_id,
        user_id=jr.user_id,
        user=user,
        status=jr.status,
        created_at=jr.created_at,
    )
@router.get("/my/pending-reviews", response_model=list[MeetupSummary])
async def get_pending_review_meetups(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from datetime import datetime, timezone
    from app.models.moderation import Review

    now = datetime.now(timezone.utc)

    my_meetups_result = await db.execute(
        select(Meetup)
        .join(MeetupParticipant, MeetupParticipant.meetup_id == Meetup.id)
        .where(
            MeetupParticipant.user_id == current_user.id,
            MeetupParticipant.status == "active",
            Meetup.end_time <= now,
            Meetup.status == "active",
        )
    )
    my_meetups = my_meetups_result.scalars().unique().all()

    pending = []
    for meetup in my_meetups:
        others_result = await db.execute(
            select(MeetupParticipant.user_id).where(
                MeetupParticipant.meetup_id == meetup.id,
                MeetupParticipant.status == "active",
                MeetupParticipant.user_id != current_user.id,
            )
        )
        other_ids = set(others_result.scalars().all())
        if not other_ids:
            continue

        reviewed_result = await db.execute(
            select(Review.reviewed_user_id).where(
                Review.reviewer_id == current_user.id,
                Review.meetup_id == meetup.id,
            )
        )
        reviewed_ids = set(reviewed_result.scalars().all())

        if other_ids - reviewed_ids:
            point = to_shape(meetup.location)
            pending.append(
                MeetupSummary(
                    id=meetup.id,
                    title=meetup.title,
                    activity_type=meetup.activity_type,
                    place_name=meetup.place_name,
                    start_time=meetup.start_time,
                    status=meetup.status,
                    participant_count=len(other_ids) + 1,
                    distance_km=None,
                    latitude=point.y,
                    longitude=point.x,
                )
            )

    return pending
@router.post("/{meetup_id}/join", status_code=status.HTTP_201_CREATED)
async def request_to_join(
    meetup_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    meetup_result = await db.execute(select(Meetup).where(Meetup.id == meetup_id))
    meetup = meetup_result.scalar_one_or_none()
    if meetup is None or meetup.status != "active":
        raise HTTPException(status_code=404, detail="Meetup not found or no longer active")

    already_participant = await db.execute(
        select(MeetupParticipant).where(
            MeetupParticipant.meetup_id == meetup_id,
            MeetupParticipant.user_id == current_user.id,
            MeetupParticipant.status == "active",
        )
    )
    if already_participant.scalar_one_or_none() is not None:
        raise HTTPException(status_code=400, detail="Already a participant")

    existing_request = await db.execute(
        select(JoinRequest).where(
            JoinRequest.meetup_id == meetup_id,
            JoinRequest.user_id == current_user.id,
            JoinRequest.status == "pending",
        )
    )
    if existing_request.scalar_one_or_none() is not None:
        raise HTTPException(status_code=400, detail="Request already pending")

    join_request = JoinRequest(meetup_id=meetup_id, user_id=current_user.id)
    db.add(join_request)
    await db.commit()
    return {"detail": "Request sent", "request_id": join_request.id}


async def _resolve_join_request(
    db: AsyncSession,
    meetup_id: uuid.UUID,
    request_id: uuid.UUID,
    current_user: User,
    accept: bool,
):
    meetup_result = await db.execute(select(Meetup).where(Meetup.id == meetup_id))
    meetup = meetup_result.scalar_one_or_none()
    if meetup is None:
        raise HTTPException(status_code=404, detail="Meetup not found")
    if meetup.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the organizer can respond to requests")

    request_result = await db.execute(
        select(JoinRequest).where(JoinRequest.id == request_id, JoinRequest.meetup_id == meetup_id)
    )
    join_request = request_result.scalar_one_or_none()
    if join_request is None or join_request.status != "pending":
        raise HTTPException(status_code=404, detail="Join request not found or already resolved")

    join_request.status = "accepted" if accept else "declined"
    join_request.resolved_at = datetime.now(timezone.utc)

    if accept:
        existing_participant_result = await db.execute(
            select(MeetupParticipant).where(
                MeetupParticipant.meetup_id == meetup_id,
                MeetupParticipant.user_id == join_request.user_id,
            )
        )
        existing_participant = existing_participant_result.scalar_one_or_none()
        if existing_participant is not None:
            existing_participant.status = "active"
        else:
            db.add(MeetupParticipant(meetup_id=meetup_id, user_id=join_request.user_id))

        chat_result = await db.execute(select(Chat).where(Chat.meetup_id == meetup_id))
        chat = chat_result.scalar_one_or_none()
        if chat is not None:
            existing_chat_participant = await db.execute(
                select(ChatParticipant).where(
                    ChatParticipant.chat_id == chat.id,
                    ChatParticipant.user_id == join_request.user_id,
                )
            )
            if existing_chat_participant.scalar_one_or_none() is None:
                db.add(ChatParticipant(chat_id=chat.id, user_id=join_request.user_id))
            db.add(Message(
                chat_id=chat.id,
                sender_id=None,
                message_type="system",
                content="A new participant joined the meetup.",
            ))

    await db.commit()
    return join_request


@router.post("/{meetup_id}/requests/{request_id}/accept")
async def accept_join_request(
    meetup_id: uuid.UUID,
    request_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    jr = await _resolve_join_request(db, meetup_id, request_id, current_user, accept=True)
    return {"detail": "Request accepted", "request_id": jr.id}


@router.post("/{meetup_id}/requests/{request_id}/decline")
async def decline_join_request(
    meetup_id: uuid.UUID,
    request_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    jr = await _resolve_join_request(db, meetup_id, request_id, current_user, accept=False)
    return {"detail": "Request declined", "request_id": jr.id}


@router.post("/{meetup_id}/arrived")
async def mark_arrived(
    meetup_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(MeetupParticipant).where(
            MeetupParticipant.meetup_id == meetup_id,
            MeetupParticipant.user_id == current_user.id,
        )
    )
    participant = result.scalar_one_or_none()
    if participant is None:
        raise HTTPException(status_code=403, detail="You are not a participant of this meetup")

    participant.arrived_at = datetime.now(timezone.utc)
    await db.commit()
    return {"detail": "Marked as arrived"}