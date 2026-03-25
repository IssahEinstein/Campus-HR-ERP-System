"""
Tests for the one-time admin bootstrap endpoint.

The bootstrap endpoint is:  POST /api/admin/bootstrap
  - Header: x-admin-bootstrap-key
  - Returns 201 on first successful call
  - Returns 409 if any admin already exists
  - Returns 403 for wrong/missing key
  - Returns 503 if ADMIN_BOOTSTRAP_KEY is not configured

All Prisma DB calls and settings are mocked so no real DB is needed.
"""
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

VALID_KEY = "test-bootstrap-key-xyz123"

PAYLOAD = {
    "email": "newadmin@test.com",
    "password": "StrongPass123!",
    "first_name": "Test",
    "last_name": "Admin",
    "admin_id": "ADMIN-TEST-001",
}


def _mock_settings(key: str = VALID_KEY) -> MagicMock:
    s = MagicMock()
    s.ADMIN_BOOTSTRAP_KEY = key
    return s


# ---------------------------------------------------------------------------
# Success path
# ---------------------------------------------------------------------------

async def test_bootstrap_success(client: httpx.AsyncClient):
    mock_user = MagicMock()
    mock_user.id = "new-user-id"
    mock_user.email = "newadmin@test.com"
    mock_admin = MagicMock()
    mock_admin.id = "new-admin-profile-id"

    with (
        patch("app.services.admin_service.settings", _mock_settings()),
        patch("app.services.admin_service.db") as mock_db,
    ):
        # First find_first: no existing admin; second: no duplicate admin_id
        mock_db.admin.find_first = AsyncMock(side_effect=[None, None])
        mock_db.user.find_unique = AsyncMock(return_value=None)
        mock_db.user.create = AsyncMock(return_value=mock_user)
        mock_db.admin.create = AsyncMock(return_value=mock_admin)

        resp = await client.post(
            "/api/admin/bootstrap",
            json=PAYLOAD,
            headers={"x-admin-bootstrap-key": VALID_KEY},
        )

    assert resp.status_code == 201
    data = resp.json()
    assert data["message"] == "Initial admin created successfully"
    assert data["user_id"] == "new-user-id"
    assert data["admin_profile_id"] == "new-admin-profile-id"
    assert data["email"] == "newadmin@test.com"


# ---------------------------------------------------------------------------
# Already completed
# ---------------------------------------------------------------------------

async def test_bootstrap_already_completed_returns_409(client: httpx.AsyncClient):
    with patch("app.services.admin_service.db") as mock_db:
        mock_db.admin.find_first = AsyncMock(return_value=MagicMock())  # admin exists

        resp = await client.post(
            "/api/admin/bootstrap",
            json=PAYLOAD,
            headers={"x-admin-bootstrap-key": VALID_KEY},
        )

    assert resp.status_code == 409
    assert "already" in resp.json()["detail"].lower()


# ---------------------------------------------------------------------------
# Wrong key / missing key
# ---------------------------------------------------------------------------

async def test_bootstrap_wrong_key_returns_403(client: httpx.AsyncClient):
    with (
        patch("app.services.admin_service.settings", _mock_settings()),
        patch("app.services.admin_service.db") as mock_db,
    ):
        mock_db.admin.find_first = AsyncMock(return_value=None)

        resp = await client.post(
            "/api/admin/bootstrap",
            json=PAYLOAD,
            headers={"x-admin-bootstrap-key": "definitely-wrong-key"},
        )

    assert resp.status_code == 403


async def test_bootstrap_no_key_header_returns_403(client: httpx.AsyncClient):
    with (
        patch("app.services.admin_service.settings", _mock_settings()),
        patch("app.services.admin_service.db") as mock_db,
    ):
        mock_db.admin.find_first = AsyncMock(return_value=None)

        resp = await client.post("/api/admin/bootstrap", json=PAYLOAD)  # no header

    assert resp.status_code == 403


# ---------------------------------------------------------------------------
# Bootstrap key not configured
# ---------------------------------------------------------------------------

async def test_bootstrap_key_not_configured_returns_503(client: httpx.AsyncClient):
    with (
        patch("app.services.admin_service.settings", _mock_settings(key="")),
        patch("app.services.admin_service.db") as mock_db,
    ):
        mock_db.admin.find_first = AsyncMock(return_value=None)

        resp = await client.post(
            "/api/admin/bootstrap",
            json=PAYLOAD,
            headers={"x-admin-bootstrap-key": VALID_KEY},
        )

    assert resp.status_code == 503


# ---------------------------------------------------------------------------
# Duplicate email / duplicate admin_id
# ---------------------------------------------------------------------------

async def test_bootstrap_duplicate_email_returns_409(client: httpx.AsyncClient):
    with (
        patch("app.services.admin_service.settings", _mock_settings()),
        patch("app.services.admin_service.db") as mock_db,
    ):
        mock_db.admin.find_first = AsyncMock(return_value=None)   # no existing admin
        mock_db.user.find_unique = AsyncMock(return_value=MagicMock())  # email taken

        resp = await client.post(
            "/api/admin/bootstrap",
            json=PAYLOAD,
            headers={"x-admin-bootstrap-key": VALID_KEY},
        )

    assert resp.status_code == 409


async def test_bootstrap_duplicate_admin_id_returns_409(client: httpx.AsyncClient):
    with (
        patch("app.services.admin_service.settings", _mock_settings()),
        patch("app.services.admin_service.db") as mock_db,
    ):
        # First call (check for any admin) → None, second call (check admin_id) → collision
        mock_db.admin.find_first = AsyncMock(side_effect=[None, MagicMock()])
        mock_db.user.find_unique = AsyncMock(return_value=None)

        resp = await client.post(
            "/api/admin/bootstrap",
            json=PAYLOAD,
            headers={"x-admin-bootstrap-key": VALID_KEY},
        )

    assert resp.status_code == 409
