import random
import uuid

ADJECTIVES = [
    "Swift", "Brave", "Clever", "Lucky", "Silent", "Bright", "Bold", "Calm",
    "Wild", "Gentle", "Fierce", "Sunny", "Cosmic", "Golden", "Silver", "Rapid",
    "Mighty", "Noble", "Quiet", "Fuzzy",
]
NOUNS = [
    "Fox", "Wolf", "Falcon", "Tiger", "Panda", "Otter", "Hawk", "Bear",
    "Lynx", "Raven", "Dolphin", "Eagle", "Panther", "Rabbit", "Deer", "Owl",
    "Cobra", "Lion", "Shark", "Crane",
]


def generate_username() -> str:
    adj = random.choice(ADJECTIVES)
    noun = random.choice(NOUNS)
    num = random.randint(1, 999)
    return f"{adj}{noun}{num}"


async def generate_unique_username(db) -> str:
    from sqlalchemy import select
    from app.models.user import User

    for _ in range(20):
        candidate = generate_username()
        result = await db.execute(select(User).where(User.username == candidate))
        if result.scalar_one_or_none() is None:
            return candidate

    return f"User{uuid.uuid4().hex[:8]}"