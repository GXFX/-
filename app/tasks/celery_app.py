from celery import Celery
from celery.schedules import crontab

from app.config import settings

celery_app = Celery("social_meetup", broker=settings.redis_url, backend=settings.redis_url)

celery_app.conf.beat_schedule = {
    "expire-old-meetups-every-5-minutes": {
        "task": "app.tasks.meetup_tasks.expire_old_meetups",
        "schedule": crontab(minute="*/5"),
    },
}
celery_app.conf.timezone = "UTC"

# Make sure task modules are registered
celery_app.autodiscover_tasks(["app.tasks"])
