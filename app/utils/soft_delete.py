from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession


async def soft_delete(db: AsyncSession, obj) -> None:
    """
    Mark a record as soft-deleted/deactivated instead of removing it,
    so related rows (join requests, chats, meetups history, FKs) stay intact.
    """
    now = datetime.now(timezone.utc)
    if hasattr(obj, "deactivated_at"):
        obj.deactivated_at = now
    if hasattr(obj, "deleted_at"):
        obj.deleted_at = now
    await db.commit()