"""
Отправка push-уведомлений через Web Push (VAPID).

ВАЖНО — 2 предположения, которые нужно проверить/подставить:
1. Требуется пакет pywebpush: pip install pywebpush --break-system-packages,
   и добавить `pywebpush` в requirements.txt + docker-compose build api.
2. Импорт настроек ниже (`from app.config import ...`) предполагает, что
   в app/config.py есть (или ты добавишь) три переменные:
     VAPID_PUBLIC_KEY = "..."
     VAPID_PRIVATE_KEY = "..."
     VAPID_CLAIMS_EMAIL = "you@example.com"
   Если у тебя вместо плоских переменных объект settings (Pydantic
   Settings) — поправь строку импорта и обращения ниже под него.

Как получить сами VAPID-ключи (один раз, руками, не через код):
   npx web-push generate-vapid-keys
Выведет Public Key и Private Key — их и нужно положить в app/config.py.
"""
import json
from datetime import datetime

from pywebpush import WebPushException, webpush
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.push import PushSubscription


async def send_push_to_user(
    db: AsyncSession,
    user_id,
    title: str,
    body: str,
    url: str | None = None,
) -> None:
    """Шлёт push всем устройствам юзера. Тихо чистит мёртвые подписки."""
    result = await db.execute(
        select(PushSubscription).where(PushSubscription.user_id == user_id)
    )
    subscriptions = result.scalars().all()
    if not subscriptions:
        return

    payload = json.dumps({"title": title, "body": body, "url": url or "/"})
    dead_ids = []

    for sub in subscriptions:
        try:
            webpush(
                subscription_info={
                    "endpoint": sub.endpoint,
                    "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
                },
                data=payload,
                vapid_private_key=settings.vapid_private_key,
                vapid_claims={"sub": f"mailto:{settings.vapid_claims_email}"},
            )
        except WebPushException as exc:
            status_code = getattr(exc.response, "status_code", None)
            # 404/410 = подписка больше не существует (юзер снёс приложение,
            # отозвал разрешение и т.п.) — чистим, чтобы не пытаться снова
            if status_code in (404, 410):
                dead_ids.append(sub.id)

    if dead_ids:
        await db.execute(
            delete(PushSubscription).where(PushSubscription.id.in_(dead_ids))
        )
        await db.commit()
