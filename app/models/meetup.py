import uuid
from datetime import datetime

from geoalchemy2 import Geography
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Meetup(Base):
    __tablename__ = "meetups"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    creator_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    city_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("cities.id"), nullable=False)

    title: Mapped[str | None] = mapped_column(String(200), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    activity_type: Mapped[str] = mapped_column(String(30), nullable=False)
    place_name: Mapped[str | None] = mapped_column(String(200), nullable=True)

    location = mapped_column(Geography(geometry_type="POINT", srid=4326), nullable=False)

    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    max_participants: Mapped[int | None] = mapped_column(Integer, nullable=True)
    min_age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    max_age: Mapped[int | None] = mapped_column(Integer, nullable=True)

    visibility: Mapped[str] = mapped_column(String(10), default="public")  # public | private
    status: Mapped[str] = mapped_column(String(15), default="active")     # active | expired | cancelled

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class MeetupParticipant(Base):
    __tablename__ = "meetup_participants"

    meetup_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("meetups.id"), primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    status: Mapped[str] = mapped_column(String(15), default="active")  # active | left | removed
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    arrived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class JoinRequest(Base):
    __tablename__ = "join_requests"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    meetup_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("meetups.id"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(15), default="pending")  # pending | accepted | declined
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)