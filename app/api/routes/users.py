import uuid
from datetime import datetime, timezone
from pydantic import BaseModel
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.utils.soft_delete import soft_delete
from app.core.cloudinary_service import get_default_avatars, init_cloudinary, upload_avatar_to_cloudinary
from app.database import get_db
from app.models.moderation import Block, Report
from app.models.meetup import Meetup, MeetupParticipant
from app.models.user import User
from app.schemas.user import ReportRequest, UserMe, UserPublic, UserUpdateRequest

# Initialize Cloudinary on startup
init_cloudinary()

router = APIRouter(prefix="/users", tags=["users"])

# Max file size: 5MB
MAX_UPLOAD_SIZE = 5 * 1024 * 1024

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "gif", "webp"}


def validate_file_extension(filename: str) -> bool:
    """Check if file has allowed extension"""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    return ext in ALLOWED_EXTENSIONS


@router.get("/me", response_model=UserMe)
async def read_me(current_user: User = Depends(get_current_user)):
    from datetime import date
    today = date.today()
    dob = current_user.date_of_birth
    current_user.age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    return current_user


@router.put("/me", response_model=UserMe)
async def update_me(
    payload: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Такой ник уже занят"
        )
    await db.refresh(current_user)
    return current_user


@router.post("/me/avatar", response_model=UserMe)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload avatar image for current user.
    Supported formats: JPG, PNG, GIF, WebP (max 5MB)
    """
    # Validate file extension
    if not validate_file_extension(file.filename or ""):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Allowed: jpg, png, gif, webp",
        )

    # Validate file size
    content = await file.read()
    if len(content) > MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File too large. Max size: 5MB",
        )

    # Reset file pointer
    await file.seek(0)

    # Upload to Cloudinary
    photo_url = await upload_avatar_to_cloudinary(
        file_content=content,
        filename=file.filename or "avatar",
        user_id=str(current_user.id),
    )

    if not photo_url:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload avatar",
        )

    # Update user photo_url in database
    current_user.photo_url = photo_url
    await db.commit()
    await db.refresh(current_user)

    return current_user


@router.get("/avatars/default")
async def get_default_avatars_endpoint():
    """
    Get list of default avatar templates.
    User can choose one of these instead of uploading photo.
    """
    return {"avatars": get_default_avatars()}


@router.post("/me/avatar/default/{avatar_id}", response_model=UserMe)
async def set_default_avatar(
    avatar_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Set one of the default avatars for current user"""
    default_avatars = get_default_avatars()
    avatar = next((a for a in default_avatars if a["id"] == avatar_id), None)

    if not avatar:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Avatar template not found"
        )

    current_user.photo_url = avatar["url"]
    await db.commit()
    await db.refresh(current_user)

    return current_user


@router.get("/{user_id}", response_model=UserPublic)
async def read_user(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Count meetups this user created (any status)
    created_count_result = await db.execute(
        select(func.count(Meetup.id)).where(Meetup.creator_id == user_id)
    )
    created_count = created_count_result.scalar_one()

    # Count meetups this user attended that have finished (status = expired)
    completed_count_result = await db.execute(
        select(func.count(MeetupParticipant.meetup_id))
        .join(Meetup, Meetup.id == MeetupParticipant.meetup_id)
        .where(
            MeetupParticipant.user_id == user_id,
            MeetupParticipant.status == "active",
            Meetup.status == "expired",
        )
    )
    completed_count = completed_count_result.scalar_one()

    from datetime import date
    today = date.today()
    dob = user.date_of_birth
    age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

    user.meetups_created_count = created_count
    user.meetups_completed_count = completed_count
    user.age = age
    return user


@router.post("/{user_id}/block", status_code=status.HTTP_204_NO_CONTENT)
async def block_user(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot block yourself")
    existing = await db.execute(
        select(Block).where(Block.blocker_id == current_user.id, Block.blocked_id == user_id)
    )
    if existing.scalar_one_or_none() is None:
        db.add(Block(blocker_id=current_user.id, blocked_id=user_id))
        await db.commit()


@router.delete("/{user_id}/block", status_code=status.HTTP_204_NO_CONTENT)
async def unblock_user(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Block).where(Block.blocker_id == current_user.id, Block.blocked_id == user_id)
    )
    block = result.scalar_one_or_none()
    if block is not None:
        await db.delete(block)
        await db.commit()


@router.post("/{user_id}/report", status_code=status.HTTP_201_CREATED)
async def report_user(
    user_id: uuid.UUID,
    payload: ReportRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    db.add(Report(reporter_id=current_user.id, reported_user_id=user_id, reason=payload.reason))
    await db.commit()
    return {"detail": "Report submitted"}

@router.post("/support/message", status_code=status.HTTP_201_CREATED)
async def send_support_message(
    payload: ReportRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    db.add(Report(reporter_id=current_user.id, reported_user_id=None, reason=payload.reason))
    await db.commit()
    return {"detail": "Message sent"}

@router.post("/me/deactivate", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await soft_delete(db, current_user)

class VerificationRequest(BaseModel):
    contact: str


@router.post("/me/request-verification", response_model=UserMe)
async def request_verification(
    payload: VerificationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    current_user.verification_contact = payload.contact
    current_user.verification_status = "pending"
    await db.commit()
    await db.refresh(current_user)
    return current_user