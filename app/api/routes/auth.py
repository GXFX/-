"""
Auth endpoints.

NOTE on OTP: the brief specifies phone auth via SMS OTP as the preferred MVP
flow. That requires picking an SMS provider (see app/config.py -
SMS_PROVIDER_API_KEY). Until a provider is wired up, this module ships a
password-based flow so the rest of the app (and your testing) isn't blocked.
Swap `register`/`login` for OTP-based versions by adding an `send_otp` /
`verify_otp` pair that calls the SMS provider and skips password_hash
entirely - the token-issuing logic below stays the same either way.
"""
from datetime import date
import random

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cloudinary_service import get_default_avatars
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.database import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, RefreshRequest, RegisterRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])

from app.core.limiter import limiter

MIN_AGE_YEARS = 18


def _is_old_enough(dob: date, min_years: int = MIN_AGE_YEARS) -> bool:
    today = date.today()
    age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    return age >= min_years


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register(request: Request, payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    if not _is_old_enough(payload.date_of_birth):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Must be 18 or older to register")

    existing = await db.execute(select(User).where(User.phone == payload.phone))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Phone number already registered")

    from app.core.username_gen import generate_unique_username
    username = await generate_unique_username(db)

    # Assign a random default avatar so the profile never looks empty
    random_avatar = random.choice(get_default_avatars())

    user = User(
        phone=payload.phone,
        username=username,
        name=payload.name,
        date_of_birth=payload.date_of_birth,
        password_hash=hash_password(payload.password),
        photo_url=random_avatar["url"],
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login(request: Request, payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.phone == payload.phone))
    user = result.scalar_one_or_none()

    if user is None or user.password_hash is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid phone or password")

    if user.deactivated_at is not None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")

    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(payload: RefreshRequest):
    data = decode_token(payload.refresh_token)
    if data is None or data.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    user_id = data["sub"]
    return TokenResponse(
        access_token=create_access_token(user_id),
        refresh_token=create_refresh_token(user_id),  # rotate refresh token
    )