from unittest.mock import AsyncMock, MagicMock, patch

import httpx


async def test_rename_department_success(client: httpx.AsyncClient, admin_token: str):
    existing = MagicMock()
    existing.id = "dept-1"
    existing.name = "Computer Science"

    updated = MagicMock()
    updated.id = "dept-1"
    updated.name = "Computer Engineering"
    updated.adminId = "admin-profile-id"
    updated.createdAt = "2026-01-01T00:00:00Z"

    with patch("app.services.department_service.db") as mock_db:
        mock_db.department.find_unique = AsyncMock(side_effect=[existing, None])
        mock_db.department.update = AsyncMock(return_value=updated)

        response = await client.patch(
            "/api/admin/departments/dept-1",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"name": "Computer Engineering"},
        )

    assert response.status_code == 200
    assert response.json()["name"] == "Computer Engineering"


async def test_rename_department_conflict(client: httpx.AsyncClient, admin_token: str):
    current = MagicMock()
    current.id = "dept-1"
    current.name = "Computer Science"

    existing = MagicMock()
    existing.id = "dept-2"

    with patch("app.services.department_service.db") as mock_db:
        mock_db.department.find_unique = AsyncMock(side_effect=[current, existing])

        response = await client.patch(
            "/api/admin/departments/dept-1",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"name": "Mathematics"},
        )

    assert response.status_code == 409


async def test_delete_department_success(client: httpx.AsyncClient, admin_token: str):
    dept = MagicMock()
    dept.name = "Computer Science"

    with patch("app.services.department_service.db") as mock_db:
        mock_db.department.find_unique = AsyncMock(return_value=dept)
        mock_db.supervisor.count = AsyncMock(return_value=0)
        mock_db.worker.count = AsyncMock(return_value=0)
        mock_db.department.delete = AsyncMock(return_value=MagicMock())

        response = await client.delete(
            "/api/admin/departments/dept-1",
            headers={"Authorization": f"Bearer {admin_token}"},
        )

    assert response.status_code == 200


async def test_delete_department_blocked_when_assigned(client: httpx.AsyncClient, admin_token: str):
    dept = MagicMock()
    dept.name = "Computer Science"

    with patch("app.services.department_service.db") as mock_db:
        mock_db.department.find_unique = AsyncMock(return_value=dept)
        mock_db.supervisor.count = AsyncMock(return_value=1)
        mock_db.worker.count = AsyncMock(return_value=0)

        response = await client.delete(
            "/api/admin/departments/dept-1",
            headers={"Authorization": f"Bearer {admin_token}"},
        )

    assert response.status_code == 409
    assert "cannot delete" in response.json()["detail"].lower()