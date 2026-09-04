import uuid

import pytest


async def _register(client, phone_suffix: str):
    phone = f"+7926{phone_suffix}"
    resp = await client.post(
        "/api/v1/auth/register",
        json={
            "phone": phone,
            "name": f"User {phone_suffix}",
            "date_of_birth": "1998-05-01",
            "password": "supersecret123",
        },
    )
    return resp.json()["access_token"]


@pytest.mark.asyncio
async def test_create_meetup_requires_city(client):
    """
    A freshly registered user has no city set yet, so meetup creation
    should be rejected with a clear error rather than a 500.
    """
    suffix = f"{uuid.uuid4().int % 10_000_000:07d}"
    token = await _register(client, suffix)

    resp = await client.post(
        "/api/v1/meetups",
        json={
            "activity_type": "bar",
            "place_name": "Pier Bar",
            "latitude": 55.910,
            "longitude": 37.760,
            "start_time": "2030-01-01T21:00:00Z",
            "end_time": "2030-01-01T23:00:00Z",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 400
    assert "city" in resp.json()["detail"].lower()
