from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import httpx


def _payroll_payload(*, start: datetime, end: datetime) -> dict:
    return {
        "worker_id": "worker-1",
        "pay_period_start": start.isoformat(),
        "pay_period_end": end.isoformat(),
        "hourly_rate": 20,
        "tax_rate": 0.1,
        "deductions": 5,
        "notes": "test run",
    }


def _paystub(**overrides):
    base = {
        "id": "stub-1",
        "workerId": "worker-1",
        "payPeriodStart": datetime(2026, 4, 1, tzinfo=timezone.utc),
        "payPeriodEnd": datetime(2026, 4, 15, tzinfo=timezone.utc),
        "totalHours": 5.5,
        "hourlyRate": 20.0,
        "grossPay": 110.0,
        "taxWithheld": 11.0,
        "deductions": 5.0,
        "netPay": 94.0,
        "status": "GENERATED",
        "notes": "test run",
        "createdAt": datetime(2026, 4, 16, tzinfo=timezone.utc),
        "updatedAt": datetime(2026, 4, 16, tzinfo=timezone.utc),
    }
    base.update(overrides)
    return SimpleNamespace(**base)


async def test_generate_paystub_blocks_future_period(
    client: httpx.AsyncClient, admin_token: str
):
    now = datetime.now(timezone.utc)

    with patch("app.services.payroll_service.db") as mock_db:
        mock_db.worker.find_unique = AsyncMock(return_value=SimpleNamespace(id="worker-1"))

        response = await client.post(
            "/api/payroll/generate",
            headers={"Authorization": f"Bearer {admin_token}"},
            json=_payroll_payload(
                start=now - timedelta(days=1),
                end=now + timedelta(days=1),
            ),
        )

    assert response.status_code == 400
    assert "future pay period" in response.json()["detail"].lower()


async def test_generate_paystub_updates_existing_generated_stub_with_all_completed_shifts(
    client: httpx.AsyncClient, admin_token: str
):
    start = datetime(2026, 4, 1, tzinfo=timezone.utc)
    end = datetime(2026, 4, 15, tzinfo=timezone.utc)
    existing = SimpleNamespace(id="stub-1", status="GENERATED")
    updated = _paystub(payPeriodStart=start, payPeriodEnd=end)

    attendance = [
        SimpleNamespace(hoursWorked=2.5),
        SimpleNamespace(hoursWorked=3.0),
        SimpleNamespace(hoursWorked=None),
    ]

    with patch("app.services.payroll_service.db") as mock_db:
        mock_db.worker.find_unique = AsyncMock(return_value=SimpleNamespace(id="worker-1"))
        mock_db.paystub.find_first = AsyncMock(return_value=existing)
        mock_db.checkinout.find_many = AsyncMock(return_value=attendance)
        mock_db.paystub.update = AsyncMock(return_value=updated)
        mock_db.paystub.create = AsyncMock()

        response = await client.post(
            "/api/payroll/generate",
            headers={"Authorization": f"Bearer {admin_token}"},
            json=_payroll_payload(start=start, end=end),
        )

    assert response.status_code == 201
    assert response.json()["totalHours"] == 5.5
    assert response.json()["grossPay"] == 110.0
    assert response.json()["netPay"] == 94.0
    mock_db.paystub.update.assert_awaited_once()
    mock_db.paystub.create.assert_not_called()


async def test_delete_paystub_endpoint_deletes_generated_stub(
    client: httpx.AsyncClient, admin_token: str
):
    paystub = SimpleNamespace(id="stub-1", workerId="worker-1", status="GENERATED")

    with (
        patch("app.api.payroll.payroll_service.get_paystub", AsyncMock(return_value=paystub)),
        patch("app.api.payroll.payroll_service.delete_paystub", AsyncMock()) as delete_paystub,
    ):
        response = await client.delete(
            "/api/payroll/stub-1",
            headers={"Authorization": f"Bearer {admin_token}"},
        )

    assert response.status_code == 204
    delete_paystub.assert_awaited_once_with("stub-1")


async def test_delete_paystub_rejects_non_generated_stub(
    client: httpx.AsyncClient, admin_token: str
):
    with patch("app.services.payroll_service.db") as mock_db:
        mock_db.paystub.find_unique = AsyncMock(
            return_value=SimpleNamespace(id="stub-1", status="PAID")
        )
        mock_db.paystub.delete = AsyncMock()

        response = await client.delete(
            "/api/payroll/stub-1",
            headers={"Authorization": f"Bearer {admin_token}"},
        )

    assert response.status_code == 400
    assert "only generated pay stubs can be deleted" in response.json()["detail"].lower()
    mock_db.paystub.delete.assert_not_called()