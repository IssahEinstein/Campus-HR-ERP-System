"""
Role-based access control tests.

Each role (ADMIN, SUPERVISOR, WORKER) is tested against:
  - Admin-only routes  → only ADMIN allowed (403 for others, 403 for no token)
  - Supervisor-only routes → only SUPERVISOR allowed

Tokens are created directly (no login call needed).
DB calls that would follow a successful auth check are mocked.
"""
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest


# ---------------------------------------------------------------------------
# Admin-only routes
# ---------------------------------------------------------------------------

async def test_admin_departments_allows_admin(client: httpx.AsyncClient, admin_token: str):
    with patch("app.api.admin.department_service.list_departments", AsyncMock(return_value=[])):
        resp = await client.get(
            "/api/admin/departments",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
    assert resp.status_code == 200


async def test_admin_departments_blocks_supervisor(client: httpx.AsyncClient, supervisor_token: str):
    resp = await client.get(
        "/api/admin/departments",
        headers={"Authorization": f"Bearer {supervisor_token}"},
    )
    assert resp.status_code == 403


async def test_admin_departments_blocks_worker(client: httpx.AsyncClient, worker_token: str):
    resp = await client.get(
        "/api/admin/departments",
        headers={"Authorization": f"Bearer {worker_token}"},
    )
    assert resp.status_code == 403


async def test_admin_departments_requires_token(client: httpx.AsyncClient):
    resp = await client.get("/api/admin/departments")
    assert resp.status_code == 403


async def test_admin_workers_allows_admin(client: httpx.AsyncClient, admin_token: str):
    with patch("app.api.admin._db") as mock_db:
        mock_db.worker.find_many = AsyncMock(return_value=[])
        resp = await client.get(
            "/api/admin/workers",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
    assert resp.status_code == 200


async def test_admin_workers_blocks_supervisor(client: httpx.AsyncClient, supervisor_token: str):
    resp = await client.get(
        "/api/admin/workers",
        headers={"Authorization": f"Bearer {supervisor_token}"},
    )
    assert resp.status_code == 403


async def test_admin_supervisors_allows_admin(client: httpx.AsyncClient, admin_token: str):
    with patch("app.api.admin._db") as mock_db:
        mock_db.supervisor.find_many = AsyncMock(return_value=[])
        resp = await client.get(
            "/api/admin/supervisors",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
    assert resp.status_code == 200


async def test_admin_supervisors_blocks_worker(client: httpx.AsyncClient, worker_token: str):
    resp = await client.get(
        "/api/admin/supervisors",
        headers={"Authorization": f"Bearer {worker_token}"},
    )
    assert resp.status_code == 403


async def test_admins_list_allows_admin(client: httpx.AsyncClient, admin_token: str):
    with patch("app.api.admin._db") as mock_db:
        mock_db.admin.find_many = AsyncMock(return_value=[])
        resp = await client.get(
            "/api/admin/admins",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
    assert resp.status_code == 200


async def test_admins_list_blocks_supervisor(client: httpx.AsyncClient, supervisor_token: str):
    resp = await client.get(
        "/api/admin/admins",
        headers={"Authorization": f"Bearer {supervisor_token}"},
    )
    assert resp.status_code == 403


async def test_admin_invite_admin_allows_admin(client: httpx.AsyncClient, admin_token: str):
    payload = {
        "email": "new-admin@test.com",
        "first_name": "New",
        "last_name": "Admin",
        "admin_id": "A-9001",
    }
    with patch("app.api.admin.invite_service.invite_admin", AsyncMock(return_value={"message": "ok"})):
        resp = await client.post(
            "/api/admin/invite-admin",
            headers={"Authorization": f"Bearer {admin_token}"},
            json=payload,
        )
    assert resp.status_code == 201


async def test_admin_invite_admin_blocks_supervisor(client: httpx.AsyncClient, supervisor_token: str):
    resp = await client.post(
        "/api/admin/invite-admin",
        headers={"Authorization": f"Bearer {supervisor_token}"},
        json={
            "email": "new-admin@test.com",
            "first_name": "New",
            "last_name": "Admin",
            "admin_id": "A-9001",
        },
    )
    assert resp.status_code == 403


# ---------------------------------------------------------------------------
# Supervisor-only routes
# ---------------------------------------------------------------------------

async def test_supervisor_workers_allows_supervisor(client: httpx.AsyncClient, supervisor_token: str):
    mock_sup = MagicMock()
    mock_sup.departmentId = "dept-id"
    with patch("app.api.supervisors._db") as mock_db:
        mock_db.supervisor.find_unique = AsyncMock(return_value=mock_sup)
        mock_db.worker.find_many = AsyncMock(return_value=[])
        resp = await client.get(
            "/api/supervisor/workers",
            headers={"Authorization": f"Bearer {supervisor_token}"},
        )
    assert resp.status_code == 200


async def test_supervisor_workers_blocks_admin(client: httpx.AsyncClient, admin_token: str):
    resp = await client.get(
        "/api/supervisor/workers",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 403


async def test_supervisor_workers_blocks_worker(client: httpx.AsyncClient, worker_token: str):
    resp = await client.get(
        "/api/supervisor/workers",
        headers={"Authorization": f"Bearer {worker_token}"},
    )
    assert resp.status_code == 403


async def test_supervisor_workers_requires_token(client: httpx.AsyncClient):
    resp = await client.get("/api/supervisor/workers")
    assert resp.status_code == 403


async def test_supervisor_profile_allows_supervisor(client: httpx.AsyncClient, supervisor_token: str):
    with patch("app.api.supervisors._db") as mock_db:
        mock_profile = MagicMock()
        mock_profile.id = "sup-profile-id"
        mock_profile.supervisorId = "S001"
        mock_profile.userId = "sup-user-id"
        mock_profile.departmentId = "dept-id"
        mock_profile.createdAt = "2026-01-01T00:00:00Z"
        mock_profile.user = None
        mock_profile.department = None
        mock_db.supervisor.find_unique = AsyncMock(return_value=mock_profile)
        resp = await client.get(
            "/api/supervisor/profile",
            headers={"Authorization": f"Bearer {supervisor_token}"},
        )
    assert resp.status_code == 200


async def test_supervisor_profile_blocks_admin(client: httpx.AsyncClient, admin_token: str):
    resp = await client.get(
        "/api/supervisor/profile",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 403


# ---------------------------------------------------------------------------
# Health check is public
# ---------------------------------------------------------------------------

async def test_health_is_public(client: httpx.AsyncClient):
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"
