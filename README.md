# Social Meetup App — Backend (Phase 1)

Phase 1 scope, per the technical spec: auth, user profiles, meetups with
PostGIS geo search, join-request flow, meetup group chat scaffolding,
"I'm Here", meetup expiration job, and tests.

## What's in this folder

```
social-meetup-backend/
├── app/
│   ├── main.py              ← FastAPI app + router wiring
│   ├── config.py             ← settings loaded from .env
│   ├── database.py           ← async SQLAlchemy engine/session
│   ├── models/                ← ORM models (one file per domain)
│   ├── schemas/               ← Pydantic request/response models
│   ├── api/routes/            ← auth.py, users.py, meetups.py
│   ├── core/security.py       ← password hashing, JWT
│   └── tasks/                 ← Celery: meetup expiration job
├── alembic/                  ← DB migrations
├── tests/                    ← pytest (async, integration-style)
├── docker-compose.yml         ← db (Postgres+PostGIS), redis, api, celery
├── Dockerfile
├── requirements.txt
├── .env.example               ← copy to .env and fill in
└── pytest.ini
```

## How to run it — step by step

### 1. Copy the project to your machine
Unzip the archive I gave you into a folder, e.g. `~/projects/social-meetup-backend`.

### 2. Create your `.env` file
```bash
cd social-meetup-backend
cp .env.example .env
```
Open `.env` and at minimum change `JWT_SECRET_KEY` to a long random string.
Leave `DATABASE_URL` and `REDIS_URL` as-is — they already point at the
`db` and `redis` service names from `docker-compose.yml`.

### 3. Start everything with Docker Compose
```bash
docker compose up -d --build
```
This starts: Postgres+PostGIS, Redis, the FastAPI API (with hot-reload),
a Celery worker, and Celery beat (for the meetup-expiration job).

### 4. Create the database tables (first time only)
Because this is a fresh project, generate and apply the first migration
from inside the running `api` container:
```bash
docker compose exec api alembic revision --autogenerate -m "initial schema"
docker compose exec api alembic upgrade head
```
Any time you add or change a model in `app/models/`, repeat these two
commands to generate and apply a new migration.

### 5. Confirm it's running
Open **http://localhost:8000/docs** — you should see the interactive
Swagger UI with all the auth/users/meetups endpoints.
Or check **http://localhost:8000/health** → `{"status": "ok"}`.

### 6. Try the core flow
In the Swagger UI (`/docs`):
1. `POST /api/v1/auth/register` — create a user (18+ only).
2. Copy the `access_token` from the response.
3. Click **Authorize** (top right) and paste `Bearer <access_token>`.
4. `PUT /api/v1/users/me` — you'll need a `city_id`; for now, insert a
   city directly via `docker compose exec db psql -U meetup_user -d meetup_db`
   (an admin endpoint for managing cities is planned for Phase 5 — see
   the spec doc, section 21). Example:
   ```sql
   INSERT INTO cities (id, name, region, country, is_active, center)
   VALUES (gen_random_uuid(), 'Mytishchi', 'Moscow Oblast', 'Russia', true,
           ST_GeogFromText('SRID=4326;POINT(37.7565 55.9105)'));
   ```
   Copy the returned `id` and use it in `PUT /api/v1/users/me`.
5. `POST /api/v1/meetups` — create a meetup near that location.
6. `GET /api/v1/meetups?lat=55.9105&lng=37.7565&radius_km=5` — see it come
   back in the geo search.

### 7. Run the tests
```bash
docker compose exec api pytest -v
```

## Where you'll plug in things later

- **SMS/OTP provider**: `app/config.py` already has `sms_provider_api_key`
  / `sms_provider_sender` fields wired to `.env`. Once you pick a provider
  (see the cost/provider notes in the spec doc), add a small client in
  `app/core/` and swap the password-based `/auth/register` + `/auth/login`
  for OTP send/verify endpoints — the JWT issuing code doesn't need to change.
- **Map/geocoding provider key**: goes in the *mobile app*, not here — the
  backend only stores/queries coordinates, it never calls a maps SDK itself.
- **Push notifications (FCM)**: add a `firebase_admin`-based sender in
  `app/tasks/`, and call it from the `TODO` comment in
  `app/api/routes/meetups.py` (`request_to_join`) and from the accept/decline
  handlers.
- **WebSocket chat endpoint**: not in Phase 1 yet — this is Phase 3 per the
  spec (section 8: real-time chat architecture with Redis pub/sub fan-out).
  The `Chat`/`Message` tables already exist so Phase 3 can build directly
  on top of them.

## Notes

- Passwords are only a Phase 1 stand-in for the OTP flow described in the
  original brief — swap them out before this goes anywhere near production
  traffic aimed at real users.
- `docker compose exec api alembic downgrade -1` rolls back the last
  migration if you need to undo a schema change during development.
