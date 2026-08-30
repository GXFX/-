import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.user import UserPublic


class UserSearchResult(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    username: str
    photo_url: str | None = None
    # none | friends | request_sent | request_received
    relation_status: str
    # id заявки, если relation_status = request_sent/request_received
    request_id: uuid.UUID | None = None


class FriendRequestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    requester: UserPublic
    created_at: datetime


class FriendRequestActionResult(BaseModel):
    relation_status: str
    request_id: uuid.UUID | None = None
