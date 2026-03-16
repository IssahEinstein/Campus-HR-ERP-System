import pytest
from unittest.mock import MagicMock
from fastapi import HTTPException
from datetime import datetime, timezone

from app.services import payroll_service
from app.schemas.payroll import PayrollGenerate, PayStubStatusUpdate


PERIOD_START = datetime(2026, 3, 1, tzinfo=timezone.utc)
PERIOD_END = datetime(2026, 3, 15, tzinfo=timezone.utc)


def make_paystub(**kwargs):
    p = MagicMock()
    p.id = kwargs.get("id", "stub-1")
    p.workerId = kwargs.get("workerId", "worker-1")
    p.status = kwargs.get("status", "GENERATED")
    p.totalHours = kwargs.get("totalHours", 40.0)
    p.grossPay = kwargs.get("grossPay", 600.0)
    p.netPay = kwargs.get("netPay", 510.0)
    return p


def make_attendance_record(hours):
    r = MagicMock()
    r.hoursWorked = hours
    return r


# ── generate_paystub ──────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_generate_paystub_success(mock_db):
    mock_db.worker.find_unique.return_value = MagicMock(id="worker-1")
    mock_db.paystub.find_first.return_value = None  # no duplicate
    mock_db.checkinout.find_many.return_value = [
        make_attendance_record(8.0),
        make_attendance_record(8.0),
        make_attendance_record(8.0),
        make_attendance_record(8.0),
        make_attendance_record(8.0),
    ]  # 40 hours total
    mock_db.paystub.create.return_value = make_paystub()

    data = PayrollGenerate(
        worker_id="worker-1",
        pay_period_start=PERIOD_START,
        pay_period_end=PERIOD_END,
        hourly_rate=15.0,
        tax_rate=0.15,
    )
    result = await payroll_service.generate_paystub(data, supervisor_id="sup-1")
    assert result.id == "stub-1"
    mock_db.paystub.create.assert_called_once()


@pytest.mark.asyncio
async def test_generate_paystub_worker_not_found(mock_db):
    mock_db.worker.find_unique.return_value = None

    data = PayrollGenerate(
        worker_id="bad-id",
        pay_period_start=PERIOD_START,
        pay_period_end=PERIOD_END,
        hourly_rate=15.0,
    )
    with pytest.raises(HTTPException) as exc:
        await payroll_service.generate_paystub(data, supervisor_id="sup-1")
    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_generate_paystub_duplicate(mock_db):
    mock_db.worker.find_unique.return_value = MagicMock(id="worker-1")
    mock_db.paystub.find_first.return_value = make_paystub()  # duplicate exists

    data = PayrollGenerate(
        worker_id="worker-1",
        pay_period_start=PERIOD_START,
        pay_period_end=PERIOD_END,
        hourly_rate=15.0,
    )
    with pytest.raises(HTTPException) as exc:
        await payroll_service.generate_paystub(data, supervisor_id="sup-1")
    assert exc.value.status_code == 409


@pytest.mark.asyncio
async def test_generate_paystub_calculates_correctly(mock_db):
    mock_db.worker.find_unique.return_value = MagicMock(id="worker-1")
    mock_db.paystub.find_first.return_value = None
    mock_db.checkinout.find_many.return_value = [
        make_attendance_record(10.0),
        make_attendance_record(10.0),
    ]  # 20 hours

    captured = {}

    async def capture_create(data):
        captured.update(data)
        return make_paystub(totalHours=20.0, grossPay=300.0, netPay=255.0)

    mock_db.paystub.create.side_effect = capture_create

    data = PayrollGenerate(
        worker_id="worker-1",
        pay_period_start=PERIOD_START,
        pay_period_end=PERIOD_END,
        hourly_rate=15.0,
        tax_rate=0.15,
        deductions=0.0,
    )
    await payroll_service.generate_paystub(data, supervisor_id="sup-1")

    assert captured["totalHours"] == 20.0
    assert captured["grossPay"] == 300.0       # 20 × 15
    assert captured["taxWithheld"] == 45.0     # 300 × 0.15
    assert captured["netPay"] == 255.0         # 300 - 45


# ── update_status ─────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_update_status_generated_to_approved(mock_db):
    mock_db.paystub.find_unique.return_value = make_paystub(status="GENERATED")
    mock_db.paystub.update.return_value = make_paystub(status="APPROVED")

    data = PayStubStatusUpdate(status="APPROVED")
    result = await payroll_service.update_status("stub-1", data, supervisor_id="sup-1")
    assert result.status == "APPROVED"


@pytest.mark.asyncio
async def test_update_status_approved_to_paid(mock_db):
    mock_db.paystub.find_unique.return_value = make_paystub(status="APPROVED")
    mock_db.paystub.update.return_value = make_paystub(status="PAID")

    data = PayStubStatusUpdate(status="PAID")
    result = await payroll_service.update_status("stub-1", data, supervisor_id="sup-1")
    assert result.status == "PAID"


@pytest.mark.asyncio
async def test_update_status_invalid_skip(mock_db):
    # Cannot jump GENERATED → PAID
    mock_db.paystub.find_unique.return_value = make_paystub(status="GENERATED")
    data = PayStubStatusUpdate(status="PAID")
    with pytest.raises(HTTPException) as exc:
        await payroll_service.update_status("stub-1", data, supervisor_id="sup-1")
    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_update_status_already_paid(mock_db):
    # Cannot change a PAID stub
    mock_db.paystub.find_unique.return_value = make_paystub(status="PAID")
    data = PayStubStatusUpdate(status="APPROVED")
    with pytest.raises(HTTPException) as exc:
        await payroll_service.update_status("stub-1", data, supervisor_id="sup-1")
    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_update_status_not_found(mock_db):
    mock_db.paystub.find_unique.return_value = None
    data = PayStubStatusUpdate(status="APPROVED")
    with pytest.raises(HTTPException) as exc:
        await payroll_service.update_status("bad-id", data, supervisor_id="sup-1")
    assert exc.value.status_code == 404


# ── get_paystub ───────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_paystub_found(mock_db):
    mock_db.paystub.find_unique.return_value = make_paystub()
    result = await payroll_service.get_paystub("stub-1")
    assert result.id == "stub-1"


@pytest.mark.asyncio
async def test_get_paystub_not_found(mock_db):
    mock_db.paystub.find_unique.return_value = None
    with pytest.raises(HTTPException) as exc:
        await payroll_service.get_paystub("bad-id")
    assert exc.value.status_code == 404
