from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import HTTPException

from app.schemas.shiftswap import ShiftSwapReview
from app.services import shiftswap_service


def _dt(hour: int) -> datetime:
    return datetime(2026, 4, 7, hour, 0, tzinfo=timezone.utc)


async def test_review_swap_approved_single_executes_reassignment():
    req = SimpleNamespace(
        id="req-1",
        status="PENDING",
        fromAssignmentId="a-from",
        toAssignmentId=None,
        initiatedById="worker-1",
        targetWorkerId="worker-2",
    )
    from_assignment = SimpleNamespace(
        id="a-from",
        workerId="worker-1",
        shiftId="shift-1",
        status="ASSIGNED",
    )
    from_shift = SimpleNamespace(
        id="shift-1",
        startTime=_dt(9),
        endTime=_dt(11),
        status="SCHEDULED",
        recurrenceGroupId=None,
    )

    with patch("app.services.shiftswap_service.db") as mock_db, patch(
        "app.services.shiftswap_service.shift_service.validate_worker_for_shift",
        new=AsyncMock(),
    ) as mock_validate:
        mock_db.shiftswaprequest.find_unique = AsyncMock(return_value=req)
        mock_db.shiftassignment.find_unique = AsyncMock(return_value=from_assignment)
        mock_db.shift.find_unique = AsyncMock(return_value=from_shift)
        mock_db.shiftassignment.find_first = AsyncMock(return_value=None)
        mock_db.shiftassignment.update = AsyncMock()
        mock_db.shiftswaprequest.update = AsyncMock(return_value=SimpleNamespace(id="req-1"))

        await shiftswap_service.review_swap_request(
            "req-1",
            ShiftSwapReview(status="APPROVED", approval_notes="ok"),
            supervisor_id="sup-1",
        )

    mock_validate.assert_awaited_once_with(
        "worker-2",
        from_shift.startTime,
        from_shift.endTime,
        exclude_shift_ids={"shift-1"},
    )
    mock_db.shiftassignment.update.assert_awaited_once_with(
        where={"id": "a-from"},
        data={"workerId": "worker-2", "assignedById": "sup-1"},
    )
    mock_db.shiftswaprequest.update.assert_awaited_once()


async def test_review_swap_approved_two_way_executes_exchange():
    req = SimpleNamespace(
        id="req-2",
        status="PENDING",
        fromAssignmentId="a-from",
        toAssignmentId="a-to",
        initiatedById="worker-1",
        targetWorkerId="worker-2",
    )
    from_assignment = SimpleNamespace(
        id="a-from",
        workerId="worker-1",
        shiftId="shift-1",
        status="ASSIGNED",
    )
    to_assignment = SimpleNamespace(
        id="a-to",
        workerId="worker-2",
        shiftId="shift-2",
        status="ASSIGNED",
    )
    from_shift = SimpleNamespace(
        id="shift-1",
        startTime=_dt(9),
        endTime=_dt(11),
        status="SCHEDULED",
        recurrenceGroupId=None,
    )
    to_shift = SimpleNamespace(
        id="shift-2",
        startTime=_dt(13),
        endTime=_dt(15),
        status="SCHEDULED",
        recurrenceGroupId=None,
    )

    with patch("app.services.shiftswap_service.db") as mock_db, patch(
        "app.services.shiftswap_service.shift_service.validate_worker_for_shift",
        new=AsyncMock(),
    ) as mock_validate:
        mock_db.shiftswaprequest.find_unique = AsyncMock(return_value=req)
        mock_db.shiftassignment.find_unique = AsyncMock(
            side_effect=[from_assignment, to_assignment]
        )
        mock_db.shift.find_unique = AsyncMock(side_effect=[from_shift, to_shift])
        mock_db.shiftassignment.update = AsyncMock()
        mock_db.shiftswaprequest.update = AsyncMock(return_value=SimpleNamespace(id="req-2"))

        await shiftswap_service.review_swap_request(
            "req-2",
            ShiftSwapReview(status="APPROVED"),
            supervisor_id="sup-1",
        )

    assert mock_validate.await_count == 2
    assert mock_db.shiftassignment.update.await_count == 2
    mock_db.shiftswaprequest.update.assert_awaited_once()


async def test_review_swap_permanent_requires_recurring_assignment():
    req = SimpleNamespace(
        id="req-3",
        status="PENDING",
        fromAssignmentId="a-from",
        toAssignmentId=None,
        initiatedById="worker-1",
        targetWorkerId="worker-2",
    )
    from_assignment = SimpleNamespace(
        id="a-from",
        workerId="worker-1",
        shiftId="shift-1",
        status="ASSIGNED",
    )
    from_shift = SimpleNamespace(
        id="shift-1",
        startTime=_dt(9),
        endTime=_dt(11),
        status="SCHEDULED",
        recurrenceGroupId=None,
    )

    with patch("app.services.shiftswap_service.db") as mock_db:
        mock_db.shiftswaprequest.find_unique = AsyncMock(return_value=req)
        mock_db.shiftassignment.find_unique = AsyncMock(return_value=from_assignment)
        mock_db.shift.find_unique = AsyncMock(return_value=from_shift)

        with pytest.raises(HTTPException) as exc_info:
            await shiftswap_service.review_swap_request(
                "req-3",
                ShiftSwapReview(status="APPROVED", apply_permanently=True),
                supervisor_id="sup-1",
            )

    assert exc_info.value.status_code == 409
    assert "recurring" in str(exc_info.value.detail).lower()


async def test_review_swap_permanent_one_way_reassigns_future_group():
    req = SimpleNamespace(
        id="req-4",
        status="PENDING",
        fromAssignmentId="a-from",
        toAssignmentId=None,
        initiatedById="worker-1",
        targetWorkerId="worker-2",
    )
    from_assignment = SimpleNamespace(
        id="a-from",
        workerId="worker-1",
        shiftId="shift-1",
        status="ASSIGNED",
    )
    from_shift = SimpleNamespace(
        id="shift-1",
        startTime=_dt(9),
        endTime=_dt(11),
        status="SCHEDULED",
        recurrenceGroupId="rg-1",
    )
    future_assignment_1 = SimpleNamespace(
        id="a-f1",
        shift=SimpleNamespace(id="shift-1", startTime=_dt(9), endTime=_dt(11)),
    )
    future_assignment_2 = SimpleNamespace(
        id="a-f2",
        shift=SimpleNamespace(id="shift-2", startTime=_dt(9), endTime=_dt(11)),
    )

    with patch("app.services.shiftswap_service.db") as mock_db, patch(
        "app.services.shiftswap_service.shift_service.validate_worker_for_shift",
        new=AsyncMock(),
    ) as mock_validate:
        mock_db.shiftswaprequest.find_unique = AsyncMock(return_value=req)
        mock_db.shiftassignment.find_unique = AsyncMock(return_value=from_assignment)
        mock_db.shift.find_unique = AsyncMock(return_value=from_shift)
        mock_db.shiftassignment.find_many = AsyncMock(return_value=[future_assignment_1, future_assignment_2])
        mock_db.shiftassignment.find_first = AsyncMock(return_value=None)
        mock_db.shiftassignment.update = AsyncMock()
        mock_db.shiftswaprequest.update = AsyncMock(return_value=SimpleNamespace(id="req-4"))

        await shiftswap_service.review_swap_request(
            "req-4",
            ShiftSwapReview(status="APPROVED", apply_permanently=True),
            supervisor_id="sup-1",
        )

    assert mock_validate.await_count == 2
    assert mock_db.shiftassignment.update.await_count == 2
    mock_db.shiftswaprequest.update.assert_awaited_once()


async def test_review_swap_permanent_two_way_reassigns_both_series():
    req = SimpleNamespace(
        id="req-5",
        status="PENDING",
        fromAssignmentId="a-from",
        toAssignmentId="a-to",
        initiatedById="worker-1",
        targetWorkerId="worker-2",
    )
    from_assignment = SimpleNamespace(
        id="a-from",
        workerId="worker-1",
        shiftId="shift-1",
        status="ASSIGNED",
    )
    from_shift = SimpleNamespace(
        id="shift-1",
        startTime=_dt(9),
        endTime=_dt(11),
        status="SCHEDULED",
        recurrenceGroupId="rg-from",
    )
    to_assignment = SimpleNamespace(
        id="a-to",
        workerId="worker-2",
        shiftId="shift-2",
        status="ASSIGNED",
    )
    to_shift = SimpleNamespace(
        id="shift-2",
        startTime=_dt(13),
        endTime=_dt(15),
        status="SCHEDULED",
        recurrenceGroupId="rg-to",
    )
    from_future = [
        SimpleNamespace(
            id="a-f1",
            shift=SimpleNamespace(id="f-s1", startTime=_dt(9), endTime=_dt(11)),
        )
    ]
    to_future = [
        SimpleNamespace(
            id="a-t1",
            shift=SimpleNamespace(id="t-s1", startTime=_dt(13), endTime=_dt(15)),
        )
    ]

    with patch("app.services.shiftswap_service.db") as mock_db, patch(
        "app.services.shiftswap_service.shift_service.validate_worker_for_shift",
        new=AsyncMock(),
    ) as mock_validate:
        mock_db.shiftswaprequest.find_unique = AsyncMock(return_value=req)
        mock_db.shiftassignment.find_unique = AsyncMock(
            side_effect=[from_assignment, to_assignment]
        )
        mock_db.shift.find_unique = AsyncMock(side_effect=[from_shift, to_shift])
        mock_db.shiftassignment.find_many = AsyncMock(side_effect=[from_future, to_future])
        mock_db.shiftassignment.find_first = AsyncMock(return_value=None)
        mock_db.shiftassignment.update = AsyncMock()
        mock_db.shiftswaprequest.update = AsyncMock(return_value=SimpleNamespace(id="req-5"))

        await shiftswap_service.review_swap_request(
            "req-5",
            ShiftSwapReview(status="APPROVED", apply_permanently=True),
            supervisor_id="sup-1",
        )

    assert mock_validate.await_count == 2
    assert mock_db.shiftassignment.update.await_count == 2
    mock_db.shiftswaprequest.update.assert_awaited_once()


async def test_review_swap_permanent_two_way_requires_recurring_on_both_sides():
    req = SimpleNamespace(
        id="req-6",
        status="PENDING",
        fromAssignmentId="a-from",
        toAssignmentId="a-to",
        initiatedById="worker-1",
        targetWorkerId="worker-2",
    )
    from_assignment = SimpleNamespace(
        id="a-from",
        workerId="worker-1",
        shiftId="shift-1",
        status="ASSIGNED",
    )
    to_assignment = SimpleNamespace(
        id="a-to",
        workerId="worker-2",
        shiftId="shift-2",
        status="ASSIGNED",
    )
    from_shift = SimpleNamespace(
        id="shift-1",
        startTime=_dt(9),
        endTime=_dt(11),
        status="SCHEDULED",
        recurrenceGroupId="rg-from",
    )
    to_shift = SimpleNamespace(
        id="shift-2",
        startTime=_dt(13),
        endTime=_dt(15),
        status="SCHEDULED",
        recurrenceGroupId=None,
    )

    with patch("app.services.shiftswap_service.db") as mock_db:
        mock_db.shiftswaprequest.find_unique = AsyncMock(return_value=req)
        mock_db.shiftassignment.find_unique = AsyncMock(side_effect=[from_assignment, to_assignment])
        mock_db.shift.find_unique = AsyncMock(side_effect=[from_shift, to_shift])

        with pytest.raises(HTTPException) as exc_info:
            await shiftswap_service.review_swap_request(
                "req-6",
                ShiftSwapReview(status="APPROVED", apply_permanently=True),
                supervisor_id="sup-1",
            )

    assert exc_info.value.status_code == 409
    assert "both assignments" in str(exc_info.value.detail).lower()


async def test_submit_swap_request_persists_preferred_permanent_flag():
    create_body = SimpleNamespace(
        target_worker_id="worker-2",
        from_assignment_id="a-from",
        to_assignment_id=None,
        reason="Need recurring coverage",
        preferred_permanent=True,
    )
    worker = SimpleNamespace(id="worker-1")
    from_assignment = SimpleNamespace(id="a-from", workerId="worker-1")
    target = SimpleNamespace(id="worker-2")

    with patch("app.services.shiftswap_service.db") as mock_db:
        mock_db.worker.find_unique = AsyncMock(side_effect=[worker, target])
        mock_db.shiftassignment.find_unique = AsyncMock(return_value=from_assignment)
        mock_db.shiftswaprequest.find_first = AsyncMock(return_value=None)
        mock_db.shiftswaprequest.create = AsyncMock(return_value=SimpleNamespace(id="req-new"))

        await shiftswap_service.submit_swap_request(create_body, worker_id="worker-1")

    mock_db.shiftswaprequest.create.assert_awaited_once_with(
        data={
            "initiatedById": "worker-1",
            "targetWorkerId": "worker-2",
            "fromAssignmentId": "a-from",
            "toAssignmentId": None,
            "reason": "Need recurring coverage",
            "preferredPermanent": True,
        }
    )


async def test_submit_swap_request_accepts_public_worker_id_code():
    create_body = SimpleNamespace(
        target_worker_id="W-1002",
        from_assignment_id="a-from",
        to_assignment_id=None,
        reason=None,
        preferred_permanent=False,
    )
    initiator = SimpleNamespace(id="worker-1")
    from_assignment = SimpleNamespace(id="a-from", workerId="worker-1")
    target = SimpleNamespace(id="worker-2", workerId="W-1002")

    with patch("app.services.shiftswap_service.db") as mock_db:
        mock_db.worker.find_unique = AsyncMock(side_effect=[initiator, None])
        mock_db.worker.find_first = AsyncMock(return_value=target)
        mock_db.shiftassignment.find_unique = AsyncMock(return_value=from_assignment)
        mock_db.shiftswaprequest.find_first = AsyncMock(return_value=None)
        mock_db.shiftswaprequest.create = AsyncMock(return_value=SimpleNamespace(id="req-new"))

        await shiftswap_service.submit_swap_request(create_body, worker_id="worker-1")

    mock_db.worker.find_first.assert_awaited_once_with(
        where={
            "OR": [
                {"workerId": "W-1002"},
                {"workerId": "W-1002"},
                {"workerId": "w-1002"},
            ]
        }
    )
    mock_db.shiftswaprequest.create.assert_awaited_once_with(
        data={
            "initiatedById": "worker-1",
            "targetWorkerId": "worker-2",
            "fromAssignmentId": "a-from",
            "toAssignmentId": None,
            "reason": None,
            "preferredPermanent": False,
        }
    )
