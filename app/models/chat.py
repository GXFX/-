import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Chat(Base):
    __tablename__ = "chats"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    meetup_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("meetups.id"), nullable=True)
    is_private: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ChatParticipant(Base):
    __tablename__ = "chat_participants"

    chat_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("chats.id"), primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    last_read_at: Mapped["datetime | None"] = mapped_column(DateTime(timezone=True), nullable=True)
    hidden_at: Mapped["datetime | None"] = mapped_column(DateTime(timezone=True), nullable=True)

class Message(Base):
    __tablename__ = "messages"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chat_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("chats.id"), nullable=False)
    sender_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    photo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    message_type: Mapped[str] = mapped_column(String(10), default="text")  # text | photo | system
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
