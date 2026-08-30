import uuid
from datetime import date, datetime

import re

from pydantic import BaseModel, ConfigDict, field_validator

USERNAME_RE = re.compile(r"^[a-zA-Z0-9_]{3,30}$")


class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    username: str
    photo_url: str | None = None
    rating: float
    interests: list[str] | None = None
    verification_status: str
    meetups_created_count: int = 0
    meetups_completed_count: int = 0
    age: int | None = None


class UserMe(UserPublic):
    phone: str | None = None
    email: str | None = None
    date_of_birth: date
    city_id: uuid.UUID | None = None
    privacy_messaging: str
    created_at: datetime
    is_admin: bool = False
    verification_contact: str | None = None


class UserUpdateRequest(BaseModel):
    name: str | None = None
    username: str | None = None
    photo_url: str | None = None
    city_id: uuid.UUID | None = None
    interests: list[str] | None = None
    privacy_messaging: str | None = None
    verification_contact: str | None = None

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str | None) -> str | None:
        if v is None:
            return v
        v = v.strip()
        if not USERNAME_RE.match(v):
            raise ValueError(
                "Ник: только латинские буквы, цифры и _, от 3 до 30 символов"
            )
        return v


class ReportRequest(BaseModel):
    reason: str