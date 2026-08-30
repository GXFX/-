"""
Periodic job: flips `status` to 'expired' for any active meetup whose
end_time has passed. Keeps the map showing only current activity
(section 15 of the brief) while preserving history for stats/reviews.

Uses a plain synchronous psycopg-style connection via SQLAlchemy's sync
engine, since Celery workers are simpler to run synchronously than async.
"""
from datetime import datetime, timezone

from sqlalchemy import create_engine, text

from app.config import settings
from app.tasks.celery_app import celery_app

# Celery task run in a worker process - use a sync engine here, separate
# from the app's async engine used by FastAPI request handlers.
_sync_url = settings.database_url.replace("postgresql+asyncpg", "postgresql+psycopg2")
_sync_engine = create_engine(_sync_url)


@celery_app.task(name="app.tasks.meetup_tasks.expire_old_meetups")
def expire_old_meetups():
    now = datetime.now(timezone.utc)
    with _sync_engine.begin() as conn:
        result = conn.execute(
            text(
                "UPDATE meetups SET status = 'expired' "
                "WHERE status = 'active' AND end_time < :now"
            ),
            {"now": now},
        )
        return result.rowcount
