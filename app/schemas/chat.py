import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.user import UserPublic


class ChatSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    meetup_id: uuid.UUID | None = None
    is_private: bool
    title: str | None = None
    last_message: str | None = None
    last_message_at: datetime | None = None
    other_user: UserPublic | None = None
    unread_count: int = 0


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    chat_id: uuid.UUID
    sender_id: uuid.UUID | None
    sender: UserPublic | None = None
    content: str | None
    photo_url: str | None
    message_type: str
    created_at: datetime
    is_read: bool = False


class SendMessageRequest(BaseModel):
    content: str