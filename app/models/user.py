import uuid
from datetime import date, datetime

from sqlalchemy import ARRAY, Boolean, Date, DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username: Mapped[str] = mapped_column(String(30), unique=True, nullable=False, index=True)
    phone: Mapped[str | None] = mapped_column(String(20), unique=True, nullable=True, index=True)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True, index=True)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    date_of_birth: Mapped[date] = mapped_column(Date, nullable=False)
    photo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    city_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("cities.id"), nullable=True)
    interests: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)

    rating: Mapped[float] = mapped_column(Numeric(2, 1), default=5.0)
    verification_status: Mapped[str] = mapped_column(String(20), default="unverified")
    verification_contact: Mapped[str | None] = mapped_column(String(255), nullable=True)
    # everyone | shared_meetups | requests_only | nobody
    privacy_messaging: Mapped[str] = mapped_column(String(30), default="everyone")

    # Admin flag — grants access to /admin/* endpoints (reports, bans, verification review)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    deactivated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)