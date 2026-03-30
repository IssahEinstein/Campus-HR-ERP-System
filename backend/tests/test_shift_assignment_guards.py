from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timezone

import pytest
from fastapi import HTTPException

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
