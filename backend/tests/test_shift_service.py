import pytest
from unittest.mock import MagicMock
from fastapi import HTTPException
from datetime import datetime, timezone

from app.services import shift_service
from app.schemas.shift import ShiftCreate, ShiftUpdate


def make_shift(**kwargs):
    shift = MagicMock()
    shift.id = kwargs.get("id", "shift-1")
    shift.supervisorId = kwargs.get("supervisorId", "sup-1")
    shift.title = kwargs.get("title", "Morning Shift")
    shift.startTime = kwargs.get("startTime", datetime(2026, 3, 10, 8, 0, tzinfo=timezone.utc))
    shift.endTime = kwargs.get("endTime", datetime(2026, 3, 10, 16, 0, tzinfo=timezone.utc))
    shift.status = kwargs.get("status", "SCHEDULED")
    return shift


def make_worker(status="ACTIVE"):
    w = MagicMock()
    w.id = "worker-1"
    w.status = status
    return w


# ── create_shift ────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_shift_success(mock_db):
    mock_db.supervisor.find_unique.return_value = MagicMock(id="sup-1")
    mock_db.shift.create.return_value = make_shift()

    data = ShiftCreate(
        title="Morning Shift",
        start_time=datetime(2026, 3, 10, 8, 0, tzinfo=timezone.utc),
        end_time=datetime(2026, 3, 10, 16, 0, tzinfo=timezone.utc),
    )
    result = await shift_service.create_shift(data, supervisor_id="sup-1")
    assert result.title == "Morning Shift"
    mock_db.shift.create.assert_called_once()


@pytest.mark.asyncio
async def test_create_shift_supervisor_not_found(mock_db):
    mock_db.supervisor.find_unique.return_value = None

    data = ShiftCreate(
        title="Morning Shift",
        start_time=datetime(2026, 3, 10, 8, 0, tzinfo=timezone.utc),
        end_time=datetime(2026, 3, 10, 16, 0, tzinfo=timezone.utc),
    )
    with pytest.raises(HTTPException) as exc:
        await shift_service.create_shift(data, supervisor_id="bad-id")
    assert exc.value.status_code == 404


# ── get_shift ────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_shift_found(mock_db):
    mock_db.shift.find_unique.return_value = make_shift()
    result = await shift_service.get_shift("shift-1")
    assert result.id == "shift-1"


@pytest.mark.asyncio
async def test_get_shift_not_found(mock_db):
    mock_db.shift.find_unique.return_value = None
    with pytest.raises(HTTPException) as exc:
        await shift_service.get_shift("bad-id")
    assert exc.value.status_code == 404


# ── update_shift ─────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_update_shift_success(mock_db):
    updated = make_shift(title="Evening Shift")
    mock_db.shift.find_unique.return_value = make_shift()
    mock_db.shift.update.return_value = updated

    data = ShiftUpdate(title="Evening Shift")
    result = await shift_service.update_shift("shift-1", data)
    assert result.title == "Evening Shift"


@pytest.mark.asyncio
async def test_update_shift_not_found(mock_db):
    mock_db.shift.find_unique.return_value = None
    with pytest.raises(HTTPException) as exc:
        await shift_service.update_shift("bad-id", ShiftUpdate(title="X"))
    assert exc.value.status_code == 404


# ── delete_shift ─────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_delete_shift_success(mock_db):
    mock_db.shift.find_unique.return_value = make_shift()
    result = await shift_service.delete_shift("shift-1")
    assert result["message"] == "Shift deleted successfully"
    mock_db.shift.delete.assert_called_once()


@pytest.mark.asyncio
async def test_delete_shift_not_found(mock_db):
    mock_db.shift.find_unique.return_value = None
    with pytest.raises(HTTPException) as exc:
        await shift_service.delete_shift("bad-id")
    assert exc.value.status_code == 404


# ── assign_worker ─────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_assign_worker_success(mock_db):
    mock_db.shift.find_unique.return_value = make_shift()
    mock_db.worker.find_unique.return_value = make_worker(status="ACTIVE")
    mock_db.shiftassignment.find_many.return_value = []   # no overlap
    mock_db.shiftassignment.find_first.return_value = None  # not already assigned
    assignment = MagicMock(id="assign-1", shiftId="shift-1", workerId="worker-1")
    mock_db.shiftassignment.create.return_value = assignment

    result = await shift_service.assign_worker("shift-1", "worker-1", "sup-1")
    assert result.id == "assign-1"


@pytest.mark.asyncio
async def test_assign_worker_inactive(mock_db):
    mock_db.shift.find_unique.return_value = make_shift()
    mock_db.worker.find_unique.return_value = make_worker(status="INACTIVE")

    with pytest.raises(HTTPException) as exc:
        await shift_service.assign_worker("shift-1", "worker-1", "sup-1")
    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_assign_worker_overlap(mock_db):
    mock_db.shift.find_unique.return_value = make_shift()
    mock_db.worker.find_unique.return_value = make_worker(status="ACTIVE")
    # Simulate an overlapping assignment
    overlap = MagicMock(shiftId="other-shift")
    mock_db.shiftassignment.find_many.return_value = [overlap]

    with pytest.raises(HTTPException) as exc:
        await shift_service.assign_worker("shift-1", "worker-1", "sup-1")
    assert exc.value.status_code == 409


@pytest.mark.asyncio
async def test_assign_worker_already_assigned(mock_db):
    mock_db.shift.find_unique.return_value = make_shift()
    mock_db.worker.find_unique.return_value = make_worker(status="ACTIVE")
    mock_db.shiftassignment.find_many.return_value = []
    mock_db.shiftassignment.find_first.return_value = MagicMock()  # already assigned

    with pytest.raises(HTTPException) as exc:
        await shift_service.assign_worker("shift-1", "worker-1", "sup-1")
    assert exc.value.status_code == 409
