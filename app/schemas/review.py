import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.user import UserPublic


class ReviewCreateRequest(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: str | None = None


class ReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    reviewer: UserPublic
    meetup_id: uuid.UUID
    rating: int
    comment: str | None
    created_at: datetime