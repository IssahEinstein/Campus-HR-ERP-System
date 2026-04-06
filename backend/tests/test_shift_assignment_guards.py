from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timezone

import pytest
from fastapi import HTTPException

from app.schemas.shift import ShiftCreate
from app.services import shift_service


async def test_assign_worker_blocked_outside_availability():
    shift = MagicMock()
    shift.id = "shift-1"
    shift.startTime = datetime(2026, 4, 6, 15, 0, tzinfo=timezone.utc)
    shift.endTime = datetime(2026, 4, 6, 17, 0, tzinfo=timezone.utc)

    worker = MagicMock()
    worker.status = "ACTIVE"

    slot = MagicMock()
    slot.dayOfWeek = 0
    slot.startTime = "09:00"
    slot.endTime = "12:00"

    with patch("app.services.shift_service.db") as mock_db:
        mock_db.shift.find_unique = AsyncMock(return_value=shift)
        mock_db.worker.find_unique = AsyncMock(return_value=worker)
        mock_db.availability.find_many = AsyncMock(return_value=[slot])
        mock_db.timeoffrequest.find_first = AsyncMock(return_value=None)

        with pytest.raises(HTTPException) as exc_info:
            await shift_service.assign_worker("shift-1", "worker-1", "sup-1")

    assert exc_info.value.status_code == 409
    assert "outside" in str(exc_info.value.detail).lower()


async def test_assign_worker_blocked_by_approved_time_off():
    shift = MagicMock()
    shift.id = "shift-1"
    shift.startTime = datetime(2026, 4, 6, 10, 0, tzinfo=timezone.utc)
    shift.endTime = datetime(2026, 4, 6, 12, 0, tzinfo=timezone.utc)

    worker = MagicMock()
    worker.status = "ACTIVE"

    slot = MagicMock()
    slot.dayOfWeek = 0
    slot.startTime = "09:00"
    slot.endTime = "17:00"

    approved_request = MagicMock()

    with patch("app.services.shift_service.db") as mock_db:
        mock_db.shift.find_unique = AsyncMock(return_value=shift)
        mock_db.worker.find_unique = AsyncMock(return_value=worker)
        mock_db.availability.find_many = AsyncMock(return_value=[slot])
        mock_db.timeoffrequest.find_first = AsyncMock(return_value=approved_request)

        with pytest.raises(HTTPException) as exc_info:
            await shift_service.assign_worker("shift-1", "worker-1", "sup-1")

    assert exc_info.value.status_code == 409
    assert "time-off" in str(exc_info.value.detail).lower()


async def test_assign_worker_blocked_when_no_slot_on_shift_day():
    shift = MagicMock()
    shift.id = "shift-2"
    shift.startTime = datetime(2026, 4, 6, 10, 0, tzinfo=timezone.utc)  # Monday
    shift.endTime = datetime(2026, 4, 6, 12, 0, tzinfo=timezone.utc)

    worker = MagicMock()
    worker.status = "ACTIVE"

    tuesday_slot = MagicMock()
    tuesday_slot.dayOfWeek = 1
    tuesday_slot.startTime = "09:00"
    tuesday_slot.endTime = "17:00"

    with patch("app.services.shift_service.db") as mock_db:
        mock_db.shift.find_unique = AsyncMock(return_value=shift)
        mock_db.worker.find_unique = AsyncMock(return_value=worker)
        # First call: day-specific slots for Monday (none). Second call: all slots (Tuesday slot exists).
        mock_db.availability.find_many = AsyncMock(side_effect=[[], [tuesday_slot]])
        mock_db.timeoffrequest.find_first = AsyncMock(return_value=None)

        with pytest.raises(HTTPException) as exc_info:
            await shift_service.assign_worker("shift-2", "worker-1", "sup-1")

    assert exc_info.value.status_code == 409
    assert "outside" in str(exc_info.value.detail).lower()


async def test_assign_worker_accepts_non_zero_padded_availability_times():
    shift = MagicMock()
    shift.id = "shift-3"
    shift.startTime = datetime(2026, 4, 6, 16, 0, tzinfo=timezone.utc)
    shift.endTime = datetime(2026, 4, 6, 17, 0, tzinfo=timezone.utc)

    worker = MagicMock()
    worker.status = "ACTIVE"

    slot = MagicMock()
    slot.dayOfWeek = 0
    slot.startTime = "9:00"
    slot.endTime = "17:00"

    created_assignment = MagicMock()
    created_assignment.id = "assignment-1"

    with patch("app.services.shift_service.db") as mock_db:
        mock_db.shift.find_unique = AsyncMock(return_value=shift)
        mock_db.shift.find_many = AsyncMock(return_value=[shift])
        mock_db.worker.find_unique = AsyncMock(return_value=worker)
        mock_db.availability.find_many = AsyncMock(side_effect=[[slot], [slot]])
        mock_db.timeoffrequest.find_first = AsyncMock(return_value=None)
        mock_db.shiftassignment.find_many = AsyncMock(return_value=[])
        mock_db.shiftassignment.find_first = AsyncMock(return_value=None)
        mock_db.shiftassignment.create = AsyncMock(return_value=created_assignment)

        assignment = await shift_service.assign_worker("shift-3", "worker-1", "sup-1")

    assert assignment.id == "assignment-1"


async def test_assign_worker_accepts_12_hour_availability_times():
    shift = MagicMock()
    shift.id = "shift-4"
    shift.startTime = datetime(2026, 4, 6, 16, 0, tzinfo=timezone.utc)
    shift.endTime = datetime(2026, 4, 6, 17, 0, tzinfo=timezone.utc)

    worker = MagicMock()
    worker.status = "ACTIVE"

    slot = MagicMock()
    slot.dayOfWeek = 0
    slot.startTime = "9:00 AM"
    slot.endTime = "5:00 PM"

    created_assignment = MagicMock()
    created_assignment.id = "assignment-12h"

    with patch("app.services.shift_service.db") as mock_db:
        mock_db.shift.find_unique = AsyncMock(return_value=shift)
        mock_db.shift.find_many = AsyncMock(return_value=[shift])
        mock_db.worker.find_unique = AsyncMock(return_value=worker)
        mock_db.availability.find_many = AsyncMock(side_effect=[[slot], [slot]])
        mock_db.timeoffrequest.find_first = AsyncMock(return_value=None)
        mock_db.shiftassignment.find_many = AsyncMock(return_value=[])
        mock_db.shiftassignment.find_first = AsyncMock(return_value=None)
        mock_db.shiftassignment.create = AsyncMock(return_value=created_assignment)

        assignment = await shift_service.assign_worker("shift-4", "worker-1", "sup-1")

    assert assignment.id == "assignment-12h"


async def test_create_shift_with_worker_blocked_outside_availability_before_create():
    supervisor = MagicMock()

    slot = MagicMock()
    slot.dayOfWeek = 0
    slot.startTime = "09:00"
    slot.endTime = "12:00"

    body = ShiftCreate(
        title="Late Shift",
        location="Library",
        worker_id="worker-1",
        start_time=datetime(2026, 4, 6, 16, 0, tzinfo=timezone.utc),
        end_time=datetime(2026, 4, 6, 17, 0, tzinfo=timezone.utc),
    )

    with patch("app.services.shift_service.db") as mock_db:
        mock_db.supervisor.find_unique = AsyncMock(return_value=supervisor)
        mock_db.worker.find_unique = AsyncMock(return_value=MagicMock(status="ACTIVE"))
        mock_db.availability.find_many = AsyncMock(side_effect=[[slot], [slot]])
        mock_db.timeoffrequest.find_first = AsyncMock(return_value=None)
        mock_db.shiftassignment.find_many = AsyncMock(return_value=[])
        mock_db.shift.create = AsyncMock()

        with pytest.raises(HTTPException) as exc_info:
            await shift_service.create_shift(body, supervisor_id="sup-1")

    assert exc_info.value.status_code == 409
    assert "outside" in str(exc_info.value.detail).lower()
    mock_db.shift.create.assert_not_awaited()
