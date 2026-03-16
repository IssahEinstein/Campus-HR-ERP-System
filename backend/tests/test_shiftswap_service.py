import pytest
from unittest.mock import MagicMock
from fastapi import HTTPException
from datetime import datetime, timezone

from app.services import shiftswap_service
from app.schemas.shiftswap import ShiftSwapCreate, ShiftSwapReview


def make_swap(**kwargs):
    s = MagicMock()
    s.id = kwargs.get("id", "swap-1")
    s.initiatedById = kwargs.get("initiatedById", "worker-1")
    s.targetWorkerId = kwargs.get("targetWorkerId", "worker-2")
    s.fromAssignmentId = kwargs.get("fromAssignmentId", "assign-1")
    s.toAssignmentId = kwargs.get("toAssignmentId", None)
    s.reviewedById = kwargs.get("reviewedById", None)
    s.status = kwargs.get("status", "PENDING")
    s.reason = kwargs.get("reason", None)
    s.approvalNotes = kwargs.get("approvalNotes", None)
    s.createdAt = kwargs.get("createdAt", datetime(2026, 3, 10, tzinfo=timezone.utc))
    return s


def make_worker(worker_id="worker-1"):
    w = MagicMock()
    w.id = worker_id
    return w


def make_assignment(worker_id="worker-1"):
    a = MagicMock()
    a.id = "assign-1"
    a.workerId = worker_id
    return a


# ── submit_swap_request ───────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_submit_swap_success(mock_db):
    mock_db.worker.find_unique.side_effect = [make_worker("worker-1"), make_worker("worker-2")]
    mock_db.shiftassignment.find_unique.return_value = make_assignment("worker-1")
    mock_db.shiftswaprequest.find_first.return_value = None
    mock_db.shiftswaprequest.create.return_value = make_swap()

    data = ShiftSwapCreate(target_worker_id="worker-2", from_assignment_id="assign-1")
    result = await shiftswap_service.submit_swap_request(data, worker_id="worker-1")
    assert result.id == "swap-1"
    mock_db.shiftswaprequest.create.assert_called_once()


@pytest.mark.asyncio
async def test_submit_swap_worker_not_found(mock_db):
    mock_db.worker.find_unique.return_value = None

    data = ShiftSwapCreate(target_worker_id="worker-2", from_assignment_id="assign-1")
    with pytest.raises(HTTPException) as exc:
        await shiftswap_service.submit_swap_request(data, worker_id="bad-id")
    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_submit_swap_assignment_not_found(mock_db):
    mock_db.worker.find_unique.return_value = make_worker()
    mock_db.shiftassignment.find_unique.return_value = None

    data = ShiftSwapCreate(target_worker_id="worker-2", from_assignment_id="bad-assign")
    with pytest.raises(HTTPException) as exc:
        await shiftswap_service.submit_swap_request(data, worker_id="worker-1")
    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_submit_swap_wrong_assignment(mock_db):
    mock_db.worker.find_unique.return_value = make_worker()
    mock_db.shiftassignment.find_unique.return_value = make_assignment("other-worker")

    data = ShiftSwapCreate(target_worker_id="worker-2", from_assignment_id="assign-1")
    with pytest.raises(HTTPException) as exc:
        await shiftswap_service.submit_swap_request(data, worker_id="worker-1")
    assert exc.value.status_code == 403


@pytest.mark.asyncio
async def test_submit_swap_self_swap(mock_db):
    mock_db.worker.find_unique.return_value = make_worker()
    mock_db.shiftassignment.find_unique.return_value = make_assignment("worker-1")

    data = ShiftSwapCreate(target_worker_id="worker-1", from_assignment_id="assign-1")
    with pytest.raises(HTTPException) as exc:
        await shiftswap_service.submit_swap_request(data, worker_id="worker-1")
    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_submit_swap_duplicate_pending(mock_db):
    mock_db.worker.find_unique.side_effect = [make_worker("worker-1"), make_worker("worker-2")]
    mock_db.shiftassignment.find_unique.return_value = make_assignment("worker-1")
    mock_db.shiftswaprequest.find_first.return_value = make_swap()  # duplicate exists

    data = ShiftSwapCreate(target_worker_id="worker-2", from_assignment_id="assign-1")
    with pytest.raises(HTTPException) as exc:
        await shiftswap_service.submit_swap_request(data, worker_id="worker-1")
    assert exc.value.status_code == 409


# ── cancel_swap_request ───────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_cancel_swap_success(mock_db):
    mock_db.shiftswaprequest.find_unique.return_value = make_swap()
    mock_db.shiftswaprequest.update.return_value = make_swap(status="CANCELLED")

    result = await shiftswap_service.cancel_swap_request("swap-1", worker_id="worker-1")
    assert result.status == "CANCELLED"


@pytest.mark.asyncio
async def test_cancel_swap_not_found(mock_db):
    mock_db.shiftswaprequest.find_unique.return_value = None
    with pytest.raises(HTTPException) as exc:
        await shiftswap_service.cancel_swap_request("bad-id", worker_id="worker-1")
    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_cancel_swap_wrong_worker(mock_db):
    mock_db.shiftswaprequest.find_unique.return_value = make_swap(initiatedById="other-worker")
    with pytest.raises(HTTPException) as exc:
        await shiftswap_service.cancel_swap_request("swap-1", worker_id="worker-1")
    assert exc.value.status_code == 403


@pytest.mark.asyncio
async def test_cancel_swap_not_pending(mock_db):
    mock_db.shiftswaprequest.find_unique.return_value = make_swap(status="APPROVED")
    with pytest.raises(HTTPException) as exc:
        await shiftswap_service.cancel_swap_request("swap-1", worker_id="worker-1")
    assert exc.value.status_code == 409


# ── review_swap_request ───────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_review_swap_approve(mock_db):
    mock_db.shiftswaprequest.find_unique.return_value = make_swap()
    mock_db.shiftswaprequest.update.return_value = make_swap(status="APPROVED", reviewedById="sup-1")

    data = ShiftSwapReview(status="APPROVED")
    result = await shiftswap_service.review_swap_request("swap-1", data, supervisor_id="sup-1")
    assert result.status == "APPROVED"


@pytest.mark.asyncio
async def test_review_swap_reject(mock_db):
    mock_db.shiftswaprequest.find_unique.return_value = make_swap()
    mock_db.shiftswaprequest.update.return_value = make_swap(status="REJECTED", reviewedById="sup-1")

    data = ShiftSwapReview(status="REJECTED", approval_notes="Not approved")
    result = await shiftswap_service.review_swap_request("swap-1", data, supervisor_id="sup-1")
    assert result.status == "REJECTED"


@pytest.mark.asyncio
async def test_review_swap_invalid_status(mock_db):
    data = ShiftSwapReview(status="CANCELLED")
    with pytest.raises(HTTPException) as exc:
        await shiftswap_service.review_swap_request("swap-1", data, supervisor_id="sup-1")
    assert exc.value.status_code == 422


@pytest.mark.asyncio
async def test_review_swap_already_reviewed(mock_db):
    mock_db.shiftswaprequest.find_unique.return_value = make_swap(status="APPROVED")
    data = ShiftSwapReview(status="REJECTED")
    with pytest.raises(HTTPException) as exc:
        await shiftswap_service.review_swap_request("swap-1", data, supervisor_id="sup-1")
    assert exc.value.status_code == 409


# ── get / list ────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_swap_found(mock_db):
    mock_db.shiftswaprequest.find_unique.return_value = make_swap()
    result = await shiftswap_service.get_swap_request("swap-1")
    assert result.id == "swap-1"


@pytest.mark.asyncio
async def test_get_swap_not_found(mock_db):
    mock_db.shiftswaprequest.find_unique.return_value = None
    with pytest.raises(HTTPException) as exc:
        await shiftswap_service.get_swap_request("bad-id")
    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_list_swaps_for_worker(mock_db):
    mock_db.shiftswaprequest.find_many.return_value = [make_swap(), make_swap(id="swap-2")]
    result = await shiftswap_service.list_swap_requests_for_worker("worker-1")
    assert len(result) == 2


@pytest.mark.asyncio
async def test_list_pending_swaps(mock_db):
    mock_db.shiftswaprequest.find_many.return_value = [make_swap()]
    result = await shiftswap_service.list_pending_swaps()
    assert len(result) == 1
