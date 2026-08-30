import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.user import UserPublic

ACTIVITY_TYPES = (
    "bar", "party", "walk", "restaurant", "coffee",
    "gaming", "sports", "cinema", "music", "hangout", "other",
)


class MeetupCreateRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    activity_type: str
    place_name: str | None = None
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    start_time: datetime
    max_participants: int | None = None
    min_age: int | None = None
    max_age: int | None = None
    visibility: str = "public"


class MeetupUpdateRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None
    max_participants: int | None = None
    status: str | None = None


class MeetupSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str | None
    activity_type: str
    place_name: str | None
    start_time: datetime
    status: str
    participant_count: int = 0
    distance_km: float | None = None
    latitude: float
    longitude: float


class MeetupDetail(MeetupSummary):
    description: str | None
    end_time: datetime
    max_participants: int | None
    creator: UserPublic
    participants: list[UserPublic] = []
    chat_id: uuid.UUID | None = None


class JoinRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    meetup_id: uuid.UUID
    user_id: uuid.UUID
    user: UserPublic
    status: str
    created_at: datetime