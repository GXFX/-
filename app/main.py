import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.core.limiter import limiter

from app.api.routes import auth, meetups, users, cities, chats, reviews, admin
from app.api.routes import friends
from app.api.routes import push

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# В .env на проде задай FRONTEND_ORIGIN=https://your-app.vercel.app
# (без слэша на конце). Локально по умолчанию остаётся localhost.
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

# В продакшене прячем /docs и /redoc, чтобы структура API не была
# видна всем подряд.
docs_url = "/docs" if ENVIRONMENT != "production" else None
redoc_url = "/redoc" if ENVIRONMENT != "production" else None
openapi_url = "/openapi.json" if ENVIRONMENT != "production" else None


app = FastAPI(
    title="Social Meetup App API",
    version="0.1.0",
    description="Backend for the real-time social meetup app (Phase 1: backend foundation).",
    docs_url=docs_url,
    redoc_url=redoc_url,
    openapi_url=openapi_url,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_PREFIX = "/api/v1"

app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(friends.router, prefix=API_PREFIX)
app.include_router(users.router, prefix=API_PREFIX)
app.include_router(meetups.router, prefix=API_PREFIX)
app.include_router(cities.router, prefix=API_PREFIX)
app.include_router(chats.router, prefix=API_PREFIX)
app.include_router(reviews.router, prefix=API_PREFIX)
app.include_router(admin.router, prefix=API_PREFIX)
app.include_router(push.router, prefix=API_PREFIX)


@app.get("/health")
async def health_check():
    return {"status": "ok"}
