import uuid
from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_admin
from app.database import get_db
from app.models.moderation import Report
from app.models.user import User

router = APIRouter(prefix="/admin", tags=["admin"])


# ---------- Schemas ----------

class ReportOut(BaseModel):
    id: uuid.UUID
    reporter_id: uuid.UUID
    reporter_name: str
    reporter_username: str
    reported_user_id: uuid.UUID | None
    reported_user_name: str | None
    meetup_id: uuid.UUID | None
    message_id: uuid.UUID | None
    reason: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class ReportStatusUpdate(BaseModel):
    status: str  # reviewed | actioned | dismissed


class AdminUserOut(BaseModel):
    id: uuid.UUID
    name: str
    username: str
    date_of_birth: date
    verification_status: str
    verification_contact: str | None
    deactivated_at: datetime | None
    is_admin: bool

    class Config:
        from_attributes = True


class BirthDateUpdate(BaseModel):
    date_of_birth: date


class VerificationDecision(BaseModel):
    approve: bool  # True -> verified, False -> rejected (back to unverified)


# ---------- Reports ----------

@router.get("/reports", response_model=list[ReportOut])
async def list_reports(
    status_filter: str | None = None,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """List reports, optionally filtered by status (open/reviewed/actioned/dismissed)."""
    query = select(Report)
    if status_filter:
        query = query.where(Report.status == status_filter)
    query = query.order_by(Report.created_at.desc())

    result = await db.execute(query)
    reports = result.scalars().all()

    # Resolve reporter / reported user names in bulk
    user_ids = set()
    for r in reports:
        user_ids.add(r.reporter_id)
        if r.reported_user_id:
            user_ids.add(r.reported_user_id)

    users_result = await db.execute(select(User).where(User.id.in_(user_ids)))
    users_by_id = {u.id: u for u in users_result.scalars().all()}

    return [
        ReportOut(
            id=r.id,
            reporter_id=r.reporter_id,
            reporter_name=users_by_id.get(r.reporter_id).name if users_by_id.get(r.reporter_id) else "?",
            reporter_username=users_by_id.get(r.reporter_id).username if users_by_id.get(r.reporter_id) else "?",
            reported_user_id=r.reported_user_id,
            reported_user_name=(
                users_by_id.get(r.reported_user_id).name
                if r.reported_user_id and users_by_id.get(r.reported_user_id)
                else None
            ),
            meetup_id=r.meetup_id,
            message_id=r.message_id,
            reason=r.reason,
            status=r.status,
            created_at=r.created_at,
        )
        for r in reports
    ]


@router.put("/reports/{report_id}/status", response_model=ReportOut)
async def update_report_status(
    report_id: uuid.UUID,
    payload: ReportStatusUpdate,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    if payload.status not in ("open", "reviewed", "actioned", "dismissed"):
        raise HTTPException(status_code=400, detail="Invalid status")

    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")

    report.status = payload.status
    await db.commit()
    await db.refresh(report)

    reporter = await db.get(User, report.reporter_id)
    reported = await db.get(User, report.reported_user_id) if report.reported_user_id else None

    return ReportOut(
        id=report.id,
        reporter_id=report.reporter_id,
        reporter_name=reporter.name if reporter else "?",
        reporter_username=reporter.username if reporter else "?",
        reported_user_id=report.reported_user_id,
        reported_user_name=reported.name if reported else None,
        meetup_id=report.meetup_id,
        message_id=report.message_id,
        reason=report.reason,
        status=report.status,
        created_at=report.created_at,
    )


# ---------- Users: ban / unban ----------

@router.get("/users", response_model=list[AdminUserOut])
async def list_users(
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return result.scalars().all()


@router.post("/users/{user_id}/ban", status_code=status.HTTP_204_NO_CONTENT)
async def ban_user(
    user_id: uuid.UUID,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    user.deactivated_at = datetime.now(timezone.utc)
    await db.commit()


@router.post("/users/{user_id}/unban", status_code=status.HTTP_204_NO_CONTENT)
async def unban_user(
    user_id: uuid.UUID,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    user.deactivated_at = None
    await db.commit()

@router.put("/users/{user_id}/birth-date", response_model=AdminUserOut)
async def update_user_birth_date(
    user_id: uuid.UUID,
    payload: BirthDateUpdate,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    today = date.today()
    age = today.year - payload.date_of_birth.year - (
        (today.month, today.day) < (payload.date_of_birth.month, payload.date_of_birth.day)
    )
    if age < 18:
        raise HTTPException(status_code=400, detail="Пользователю должно быть 18+")

    user.date_of_birth = payload.date_of_birth
    await db.commit()
    await db.refresh(user)
    return user
# ---------- Verification review ----------

@router.get("/verifications", response_model=list[AdminUserOut])
async def list_pending_verifications(
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """List users who requested verification (status = pending)."""
    result = await db.execute(
        select(User).where(User.verification_status == "pending")
    )
    return result.scalars().all()


@router.post("/users/{user_id}/verification", response_model=AdminUserOut)
async def review_verification(
    user_id: uuid.UUID,
    payload: VerificationDecision,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    user.verification_status = "verified" if payload.approve else "unverified"
    await db.commit()
    await db.refresh(user)
    return user