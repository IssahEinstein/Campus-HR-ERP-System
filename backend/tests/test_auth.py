"""
Tests for the auth login endpoint.

DB calls inside auth_service are mocked so no real Supabase connection is needed.
"""
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from app.auth.password import hash_password
from app.auth.tokens import decode_access_token

TEST_PASSWORD = "TestPass123!"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _mock_user(role: str = "ADMIN", pending: bool = False) -> MagicMock:
    """Minimal User object returned by get_user_by_email."""
    user = MagicMock()
    user.id = "user-test-id"
    user.email = "user@test.com"
    user.role = role
    user.passwordHash = "INVITE_PENDING" if pending else hash_password(TEST_PASSWORD)
    return user


def _mock_user_full(role: str = "ADMIN") -> MagicMock:
    """User object with embedded profile returned by get_user_with_profile."""
    user = MagicMock()
    user.id = "user-test-id"
    user.role = role

    admin_p = MagicMock()
    admin_p.id = "admin-profile-id"
    sup_p = MagicMock()
    sup_p.id = "sup-profile-id"
    wk_p = MagicMock()
    wk_p.id = "worker-profile-id"

    user.adminProfile = admin_p if role == "ADMIN" else None
    user.supervisorProfile = sup_p if role == "SUPERVISOR" else None
    user.workerProfile = wk_p if role == "WORKER" else None
    return user


# ---------------------------------------------------------------------------
# Login tests
# ---------------------------------------------------------------------------

async def test_login_success(client: httpx.AsyncClient):
    with (
        patch("app.services.auth_service.get_user_by_email", AsyncMock(return_value=_mock_user())),
        patch("app.services.auth_service.get_user_with_profile", AsyncMock(return_value=_mock_user_full())),
        patch("app.services.auth_service.create_session", AsyncMock(return_value=MagicMock())),
    ):
        resp = await client.post(
            "/api/auth/login",
            json={"email": "user@test.com", "password": TEST_PASSWORD},
        )

    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


async def test_login_sets_refresh_cookie(client: httpx.AsyncClient):
    with (
        patch("app.services.auth_service.get_user_by_email", AsyncMock(return_value=_mock_user())),
        patch("app.services.auth_service.get_user_with_profile", AsyncMock(return_value=_mock_user_full())),
        patch("app.services.auth_service.create_session", AsyncMock(return_value=MagicMock())),
    ):
        resp = await client.post(
            "/api/auth/login",
            json={"email": "user@test.com", "password": TEST_PASSWORD},
        )

    assert resp.status_code == 200
    assert "refresh_token" in resp.cookies


async def test_login_wrong_password(client: httpx.AsyncClient):
    with patch("app.services.auth_service.get_user_by_email", AsyncMock(return_value=_mock_user())):
        resp = await client.post(
            "/api/auth/login",
            json={"email": "user@test.com", "password": "wrong_password"},
        )

    assert resp.status_code == 401


async def test_login_nonexistent_user(client: httpx.AsyncClient):
    with patch("app.services.auth_service.get_user_by_email", AsyncMock(return_value=None)):
        resp = await client.post(
            "/api/auth/login",
            json={"email": "nobody@example.com", "password": "anything"},
        )

    assert resp.status_code == 401


async def test_login_invite_pending_blocked(client: httpx.AsyncClient):
    pending_user = _mock_user(pending=True)
    pending_user_full = _mock_user_full("SUPERVISOR")
    pending_invite = MagicMock()
    pending_invite.usedAt = None
    pending_user_full.supervisorInvite = pending_invite

    with (
        patch("app.services.auth_service.get_user_by_email", AsyncMock(return_value=pending_user)),
        patch("app.services.auth_service.get_user_with_profile", AsyncMock(return_value=pending_user_full)),
    ):
        resp = await client.post(
            "/api/auth/login",
            json={"email": "user@test.com", "password": TEST_PASSWORD},
        )

    assert resp.status_code == 403
    detail = resp.json()["detail"].lower()
    assert "invite" in detail or "activated" in detail


async def test_login_token_embeds_role_and_profile_id(client: httpx.AsyncClient):
    with (
        patch("app.services.auth_service.get_user_by_email", AsyncMock(return_value=_mock_user("SUPERVISOR"))),
        patch("app.services.auth_service.get_user_with_profile", AsyncMock(return_value=_mock_user_full("SUPERVISOR"))),
        patch("app.services.auth_service.create_session", AsyncMock(return_value=MagicMock())),
    ):
        resp = await client.post(
            "/api/auth/login",
            json={"email": "user@test.com", "password": TEST_PASSWORD},
        )

    assert resp.status_code == 200
    payload = decode_access_token(resp.json()["access_token"])
    assert payload["role"] == "SUPERVISOR"
    assert payload["profile_id"] == "sup-profile-id"


async def test_login_missing_fields_rejected(client: httpx.AsyncClient):
    resp = await client.post("/api/auth/login", json={"email": "user@test.com"})
    assert resp.status_code == 422
