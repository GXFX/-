import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database import get_db
from app.models.meetup import Meetup, MeetupParticipant
from app.models.moderation import Review
from app.models.user import User
from app.schemas.review import ReviewCreateRequest, ReviewResponse

router = APIRouter(tags=["reviews"])


@router.post(
    "/meetups/{meetup_id}/reviews/{user_id}",
    response_model=ReviewResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_review(
    meetup_id: uuid.UUID,
    user_id: uuid.UUID,
    payload: ReviewCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Нельзя оценить самого себя")

    meetup_result = await db.execute(select(Meetup).where(Meetup.id == meetup_id))
    meetup = meetup_result.scalar_one_or_none()
    if meetup is None:
        raise HTTPException(status_code=404, detail="Встреча не найдена")

    from datetime import datetime, timezone
    if meetup.end_time > datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Встреча ещё не завершилась")

    my_participation = await db.execute(
        select(MeetupParticipant).where(
            MeetupParticipant.meetup_id == meetup_id,
            MeetupParticipant.user_id == current_user.id,
            MeetupParticipant.status == "active",
        )
    )
    if my_participation.scalar_one_or_none() is None:
        raise HTTPException(status_code=403, detail="Вы не были участником этой встречи")

    their_participation = await db.execute(
        select(MeetupParticipant).where(
            MeetupParticipant.meetup_id == meetup_id,
            MeetupParticipant.user_id == user_id,
            MeetupParticipant.status == "active",
        )
    )
    if their_participation.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Этот пользователь не был участником встречи")

    existing = await db.execute(
        select(Review).where(
            Review.reviewer_id == current_user.id,
            Review.reviewed_user_id == user_id,
            Review.meetup_id == meetup_id,
        )
    )
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status_code=400, detail="Вы уже оценили этого участника")

    review = Review(
        reviewer_id=current_user.id,
        reviewed_user_id=user_id,
        meetup_id=meetup_id,
        rating=payload.rating,
        comment=payload.comment,
    )
    db.add(review)
    await db.flush()

    avg_result = await db.execute(
        select(func.avg(Review.rating)).where(Review.reviewed_user_id == user_id)
    )
    avg_rating = avg_result.scalar_one()

    target_user_result = await db.execute(select(User).where(User.id == user_id))
    target_user = target_user_result.scalar_one()
    target_user.rating = round(float(avg_rating), 1) if avg_rating else 5.0

    await db.commit()
    await db.refresh(review)

    return ReviewResponse(
        id=review.id,
        reviewer=current_user,
        meetup_id=review.meetup_id,
        rating=review.rating,
        comment=review.comment,
        created_at=review.created_at,
    )


@router.get("/users/{user_id}/reviews", response_model=list[ReviewResponse])
async def get_user_reviews(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Review, User)
        .join(User, User.id == Review.reviewer_id)
        .where(Review.reviewed_user_id == user_id)
        .order_by(Review.created_at.desc())
    )
    rows = result.all()
    return [
        ReviewResponse(
            id=rv.id,
            reviewer=reviewer,
            meetup_id=rv.meetup_id,
            rating=rv.rating,
            comment=rv.comment,
            created_at=rv.created_at,
        )
        for rv, reviewer in rows
    ]