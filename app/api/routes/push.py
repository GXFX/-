"""
ВАЖНО: путь `from app.config import VAPID_PUBLIC_KEY` — то же
предположение, что в push_service.py. Поправить при необходимости.
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.utils.soft_delete import soft_delete
from app.api.deps import get_current_user
from app.config import settings
from app.core.push_service import send_push_to_user
from app.database import get_db
from app.models.push import PushSubscription
from app.models.user import User
from app.schemas.push import PushSubscriptionRequest, PushUnsubscribeRequest


router = APIRouter(prefix="/push", tags=["push"])


@router.get("/vapid-public-key")
async def get_vapid_public_key():
    return {"public_key": settings.vapid_public_key}


@router.post("/subscribe", status_code=status.HTTP_204_NO_CONTENT)
async def subscribe(
    payload: PushSubscriptionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PushSubscription).where(PushSubscription.endpoint == payload.endpoint)
    )
    existing = result.scalar_one_or_none()

    if existing is not None:
        existing.user_id = current_user.id
        existing.p256dh = payload.keys.p256dh
        existing.auth = payload.keys.auth
    else:
        db.add(
            PushSubscription(
                user_id=current_user.id,
                endpoint=payload.endpoint,
                p256dh=payload.keys.p256dh,
                auth=payload.keys.auth,
            )
        )
    await db.commit()


@router.post("/unsubscribe", status_code=status.HTTP_204_NO_CONTENT)
async def unsubscribe(
    payload: PushUnsubscribeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PushSubscription).where(
            PushSubscription.endpoint == payload.endpoint,
            PushSubscription.user_id == current_user.id,
        )
    )
    sub = result.scalar_one_or_none()
    if sub is not None:
        await soft_delete(db, sub)


@router.post("/test", status_code=status.HTTP_204_NO_CONTENT)
async def send_test_push(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Шлёт тестовый пуш самому себе — для проверки что всё настроено."""
    await send_push_to_user(
        db,
        current_user.id,
        title="Проверка уведомлений",
        body="Если ты это видишь — push работает!",
    )
