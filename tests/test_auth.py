import uuid

import pytest


@pytest.mark.asyncio
async def test_register_and_login(client):
    phone = f"+7926{uuid.uuid4().int % 10_000_000:07d}"

    register_resp = await client.post(
        "/api/v1/auth/register",
        json={
            "phone": phone,
            "name": "Test User",
            "date_of_birth": "2000-01-01",
            "password": "supersecret123",
        },
    )
    assert register_resp.status_code == 201
    tokens = register_resp.json()
    assert "access_token" in tokens
    assert "refresh_token" in tokens

    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"phone": phone, "password": "supersecret123"},
    )
    assert login_resp.status_code == 200

    me_resp = await client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
    )
    assert me_resp.status_code == 200
    assert me_resp.json()["name"] == "Test User"


@pytest.mark.asyncio
async def test_register_underage_rejected(client):
    resp = await client.post(
        "/api/v1/auth/register",
        json={
            "phone": "+79261111111",
            "name": "Too Young",
            "date_of_birth": "2015-01-01",
            "password": "supersecret123",
        },
    )
    assert resp.status_code == 400
