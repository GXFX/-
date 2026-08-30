"""
Import every model here so that:
  1. `Base.metadata` knows about all tables (needed for Alembic autogenerate).
  2. Other code can do `from app.models import User` instead of deep imports.
"""
from app.models.friendship import FriendRequest
from app.models.city import City
from app.models.user import User
from app.models.meetup import JoinRequest, Meetup, MeetupParticipant
from app.models.chat import Chat, ChatParticipant, Message
from app.models.moderation import Block, Report, Review
from app.models.push import PushSubscription
__all__ = [
    "City",
    "User",
    "Meetup",
    "MeetupParticipant",
    "JoinRequest",
    "Chat",
    "ChatParticipant",
    "Message",
    "Review",
    "Report",
    "Block",
    "PushSubscription",
]
