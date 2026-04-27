from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

from app.schemas.shift import ShiftCreate, ShiftUpdate
from app.services import shift_service


async def test_create_shift_auto_calculates_expected_hours():
    supervisor = MagicMock()
    created = MagicMock()

    with patch("app.services.shift_service.db") as mock_db:
        mock_db.supervisor.find_unique = AsyncMock(return_value=supervisor)
        mock_db.shift.create = AsyncMock(return_value=created)

        body = ShiftCreate(
            title="Morning Shift",
            location="Library",
            start_time=datetime(2026, 4, 6, 9, 0, tzinfo=timezone.utc),
            end_time=datetime(2026, 4, 6, 13, 30, tzinfo=timezone.utc),
        )

        await shift_service.create_shift(body, supervisor_id="sup-1")

    create_call = mock_db.shift.create.await_args.kwargs["data"]
    assert create_call["expectedHours"] == 4.5


async def test_update_shift_recomputes_expected_hours_from_times():
    existing_shift = MagicMock()
    existing_shift.id = "shift-1"
    existing_shift.startTime = datetime(2026, 4, 6, 9, 0, tzinfo=timezone.utc)
    existing_shift.endTime = datetime(2026, 4, 6, 12, 0, tzinfo=timezone.utc)

    updated_shift = MagicMock()

    with patch("app.services.shift_service.db") as mock_db:
        mock_db.shift.find_unique = AsyncMock(return_value=existing_shift)
        mock_db.shift.update = AsyncMock(return_value=updated_shift)

        update_body = ShiftUpdate(
            start_time=datetime(2026, 4, 6, 10, 0, tzinfo=timezone.utc),
            end_time=datetime(2026, 4, 6, 14, 45, tzinfo=timezone.utc),
            expected_hours=12.0,
        )

        await shift_service.update_shift("shift-1", update_body)

    update_call = mock_db.shift.update.await_args.kwargs["data"]
    assert update_call["expectedHours"] == 4.75
