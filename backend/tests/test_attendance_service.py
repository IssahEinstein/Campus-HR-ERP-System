import pytest
from unittest.mock import MagicMock
from fastapi import HTTPException
from datetime import datetime, timezone

from app.services import attendance_service
from app.schemas.attendance import CheckInRequest


def make_record(**kwargs):
    r = MagicMock()
    r.id = kwargs.get("id", "rec-1")
    r.workerId = kwargs.get("workerId", "worker-1")
    r.shiftAssignmentId = kwargs.get("shiftAssignmentId", "assign-1")
    r.checkedInAt = kwargs.get("checkedInAt", datetime(2026, 3, 10, 8, 0, tzinfo=timezone.utc))
    r.checkedOutAt = kwargs.get("checkedOutAt", None)
    r.hoursWorked = kwargs.get("hoursWorked", None)
    r.notes = kwargs.get("notes", None)
    return r


def make_assignment(worker_id="worker-1"):
    a = MagicMock()
    a.id = "assign-1"
    a.workerId = worker_id
    return a


# ── check_in ─────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_check_in_success(mock_db):
    mock_db.shiftassignment.find_unique.return_value = make_assignment()
    mock_db.checkinout.find_first.return_value = None  # no open record
    mock_db.checkinout.create.return_value = make_record()

    data = CheckInRequest(shift_assignment_id="assign-1")
    result = await attendance_service.check_in(data, worker_id="worker-1")
    assert result.id == "rec-1"
    mock_db.checkinout.create.assert_called_once()


@pytest.mark.asyncio
async def test_check_in_assignment_not_found(mock_db):
    mock_db.shiftassignment.find_unique.return_value = None

    data = CheckInRequest(shift_assignment_id="bad-id")
    with pytest.raises(HTTPException) as exc:
        await attendance_service.check_in(data, worker_id="worker-1")
    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_check_in_wrong_worker(mock_db):
    mock_db.shiftassignment.find_unique.return_value = make_assignment(worker_id="other-worker")

    data = CheckInRequest(shift_assignment_id="assign-1")
    with pytest.raises(HTTPException) as exc:
        await attendance_service.check_in(data, worker_id="worker-1")
    assert exc.value.status_code == 403


@pytest.mark.asyncio
async def test_check_in_already_checked_in(mock_db):
    mock_db.shiftassignment.find_unique.return_value = make_assignment()
    mock_db.checkinout.find_first.return_value = make_record()  # open record exists

    data = CheckInRequest(shift_assignment_id="assign-1")
    with pytest.raises(HTTPException) as exc:
        await attendance_service.check_in(data, worker_id="worker-1")
    assert exc.value.status_code == 409


# ── check_out ─────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_check_out_success(mock_db):
    checked_in = datetime(2026, 3, 10, 8, 0, tzinfo=timezone.utc)
    record = make_record(checkedInAt=checked_in, checkedOutAt=None)
    updated = make_record(checkedOutAt=datetime(2026, 3, 10, 16, 0, tzinfo=timezone.utc), hoursWorked=8.0)
    mock_db.checkinout.find_unique.return_value = record
    mock_db.checkinout.update.return_value = updated

    result = await attendance_service.check_out("rec-1", worker_id="worker-1")
    assert result.hoursWorked == 8.0
    mock_db.checkinout.update.assert_called_once()


@pytest.mark.asyncio
async def test_check_out_record_not_found(mock_db):
    mock_db.checkinout.find_unique.return_value = None
    with pytest.raises(HTTPException) as exc:
        await attendance_service.check_out("bad-id", worker_id="worker-1")
    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_check_out_wrong_worker(mock_db):
    mock_db.checkinout.find_unique.return_value = make_record(workerId="other-worker")
    with pytest.raises(HTTPException) as exc:
        await attendance_service.check_out("rec-1", worker_id="worker-1")
    assert exc.value.status_code == 403


@pytest.mark.asyncio
async def test_check_out_already_checked_out(mock_db):
    record = make_record(checkedOutAt=datetime(2026, 3, 10, 16, 0, tzinfo=timezone.utc))
    mock_db.checkinout.find_unique.return_value = record
    with pytest.raises(HTTPException) as exc:
        await attendance_service.check_out("rec-1", worker_id="worker-1")
    assert exc.value.status_code == 409


# ── get_record ────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_record_found(mock_db):
    mock_db.checkinout.find_unique.return_value = make_record()
    result = await attendance_service.get_record("rec-1")
    assert result.id == "rec-1"


@pytest.mark.asyncio
async def test_get_record_not_found(mock_db):
    mock_db.checkinout.find_unique.return_value = None
    with pytest.raises(HTTPException) as exc:
        await attendance_service.get_record("bad-id")
    assert exc.value.status_code == 404


# ── list records ──────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_list_records_for_worker(mock_db):
    mock_db.checkinout.find_many.return_value = [make_record(), make_record(id="rec-2")]
    result = await attendance_service.list_records_for_worker("worker-1")
    assert len(result) == 2


@pytest.mark.asyncio
async def test_list_records_for_assignment(mock_db):
    mock_db.checkinout.find_many.return_value = [make_record()]
    result = await attendance_service.list_records_for_assignment("assign-1")
    assert len(result) == 1
