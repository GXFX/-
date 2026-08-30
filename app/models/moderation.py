import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, SmallInteger, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (UniqueConstraint("reviewer_id", "reviewed_user_id", "meetup_id"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reviewer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    reviewed_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    meetup_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("meetups.id"), nullable=False)
    rating: Mapped[int] = mapped_column(SmallInteger, nullable=False)  # 1=bad 2=okay 3=great
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reporter_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    reported_user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    meetup_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("meetups.id"), nullable=True)
    message_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("messages.id"), nullable=True)
    reason: Mapped[str] = mapped_column(String(500), nullable=False)
    status: Mapped[str] = mapped_column(String(15), default="open")  # open | reviewed | actioned | dismissed
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Block(Base):
    __tablename__ = "blocks"

    blocker_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    blocked_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
