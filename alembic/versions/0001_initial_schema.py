"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-08-14

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from geoalchemy2 import Geography

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")

    op.create_table(
        "cities",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("region", sa.String(100), nullable=False),
        sa.Column("country", sa.String(100), nullable=False),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("center", Geography(geometry_type="POINT", srid=4326), nullable=True),
    )

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("password_hash", sa.String(255), nullable=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("date_of_birth", sa.Date, nullable=False),
        sa.Column("photo_url", sa.String(500), nullable=True),
        sa.Column("city_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("cities.id"), nullable=True),
        sa.Column("interests", postgresql.ARRAY(sa.String), nullable=True),
        sa.Column("rating", sa.Numeric(2, 1), server_default="5.0"),
        sa.Column("verification_status", sa.String(20), server_default="unverified"),
        sa.Column("privacy_messaging", sa.String(30), server_default="shared_meetups"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("deactivated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_users_phone", "users", ["phone"], unique=True)
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "meetups",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("creator_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("city_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("cities.id"), nullable=False),
        sa.Column("title", sa.String(200), nullable=True),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("activity_type", sa.String(30), nullable=False),
        sa.Column("place_name", sa.String(200), nullable=True),
        sa.Column("location", Geography(geometry_type="POINT", srid=4326), nullable=False),
        sa.Column("start_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("max_participants", sa.Integer, nullable=True),
        sa.Column("min_age", sa.Integer, nullable=True),
        sa.Column("max_age", sa.Integer, nullable=True),
        sa.Column("visibility", sa.String(10), server_default="public"),
        sa.Column("status", sa.String(15), server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_meetups_status_start", "meetups", ["status", "start_time"])
    op.execute("CREATE INDEX ix_meetups_location ON meetups USING GIST (location)")

    op.create_table(
        "meetup_participants",
        sa.Column("meetup_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("meetups.id"), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), primary_key=True),
        sa.Column("status", sa.String(15), server_default="active"),
        sa.Column("joined_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("arrived_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        "join_requests",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("meetup_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("meetups.id"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("status", sa.String(15), server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        "chats",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("meetup_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("meetups.id"), nullable=True),
        sa.Column("is_private", sa.Boolean, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "chat_participants",
        sa.Column("chat_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("chats.id"), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), primary_key=True),
    )

    op.create_table(
        "messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("chat_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("chats.id"), nullable=False),
        sa.Column("sender_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("content", sa.Text, nullable=True),
        sa.Column("photo_url", sa.String(500), nullable=True),
        sa.Column("message_type", sa.String(10), server_default="text"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_messages_chat_created", "messages", ["chat_id", "created_at"])

    op.create_table(
        "reviews",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("reviewer_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("reviewed_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("meetup_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("meetups.id"), nullable=False),
        sa.Column("rating", sa.SmallInteger, nullable=False),
        sa.Column("comment", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("reviewer_id", "reviewed_user_id", "meetup_id"),
    )

    op.create_table(
        "reports",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("reporter_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("reported_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("meetup_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("meetups.id"), nullable=True),
        sa.Column("message_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("messages.id"), nullable=True),
        sa.Column("reason", sa.String(500), nullable=False),
        sa.Column("status", sa.String(15), server_default="open"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "blocks",
        sa.Column("blocker_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), primary_key=True),
        sa.Column("blocked_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("blocks")
    op.drop_table("reports")
    op.drop_table("reviews")
    op.drop_table("messages")
    op.drop_table("chat_participants")
    op.drop_table("chats")
    op.drop_table("join_requests")
    op.drop_table("meetup_participants")
    op.drop_table("meetups")
    op.drop_table("users")
    op.drop_table("cities")
