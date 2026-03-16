import pytest
from unittest.mock import MagicMock
from fastapi import HTTPException
from datetime import datetime, timezone

from app.services import timeoff_service
from app.schemas.timeoff import TimeOffCreate, TimeOffReview


def make_request(**kwargs):
    r = MagicMock()
    r.id = kwargs.get("id", "req-1")
    r.workerId = kwargs.get("workerId", "worker-1")
    r.status = kwargs.get("status", "PENDING")
    r.startDate = kwargs.get("startDate", datetime(2026, 3, 15, tzinfo=timezone.utc))
    r.endDate = kwargs.get("endDate", datetime(2026, 3, 20, tzinfo=timezone.utc))
    return r


# ── submit_request ────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_submit_request_success(mock_db):
    mock_db.worker.find_unique.return_value = MagicMock(id="worker-1")
    mock_db.timeoffrequest.find_first.return_value = None  # no overlap
    mock_db.timeoffrequest.create.return_value = make_request()

    data = TimeOffCreate(
        start_date=datetime(2026, 3, 15, tzinfo=timezone.utc),
        end_date=datetime(2026, 3, 20, tzinfo=timezone.utc),
    )
    result = await timeoff_service.submit_request(data, worker_id="worker-1")
    assert result.id == "req-1"
    mock_db.timeoffrequest.create.assert_called_once()


@pytest.mark.asyncio
async def test_submit_request_worker_not_found(mock_db):
    mock_db.worker.find_unique.return_value = None

    data = TimeOffCreate(
        start_date=datetime(2026, 3, 15, tzinfo=timezone.utc),
        end_date=datetime(2026, 3, 20, tzinfo=timezone.utc),
    )
    with pytest.raises(HTTPException) as exc:
        await timeoff_service.submit_request(data, worker_id="bad-id")
    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_submit_request_overlap(mock_db):
    mock_db.worker.find_unique.return_value = MagicMock(id="worker-1")
    mock_db.timeoffrequest.find_first.return_value = make_request()  # overlap exists

    data = TimeOffCreate(
        start_date=datetime(2026, 3, 15, tzinfo=timezone.utc),
        end_date=datetime(2026, 3, 20, tzinfo=timezone.utc),
    )
    with pytest.raises(HTTPException) as exc:
        await timeoff_service.submit_request(data, worker_id="worker-1")
    assert exc.value.status_code == 409


# ── cancel_request ────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_cancel_request_success(mock_db):
    mock_db.timeoffrequest.find_unique.return_value = make_request(status="PENDING")
    mock_db.timeoffrequest.update.return_value = make_request(status="CANCELLED")

    result = await timeoff_service.cancel_request("req-1", worker_id="worker-1")
    assert result.status == "CANCELLED"


@pytest.mark.asyncio
async def test_cancel_request_not_found(mock_db):
    mock_db.timeoffrequest.find_unique.return_value = None
    with pytest.raises(HTTPException) as exc:
        await timeoff_service.cancel_request("bad-id", worker_id="worker-1")
    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_cancel_request_wrong_worker(mock_db):
    mock_db.timeoffrequest.find_unique.return_value = make_request(workerId="other-worker")
    with pytest.raises(HTTPException) as exc:
        await timeoff_service.cancel_request("req-1", worker_id="worker-1")
    assert exc.value.status_code == 403


@pytest.mark.asyncio
async def test_cancel_request_not_pending(mock_db):
    mock_db.timeoffrequest.find_unique.return_value = make_request(status="APPROVED")
    with pytest.raises(HTTPException) as exc:
        await timeoff_service.cancel_request("req-1", worker_id="worker-1")
    assert exc.value.status_code == 400


# ── review_request ────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_review_request_approve(mock_db):
    mock_db.timeoffrequest.find_unique.return_value = make_request(status="PENDING")
    mock_db.timeoffrequest.update.return_value = make_request(status="APPROVED")

    data = TimeOffReview(status="APPROVED")
    result = await timeoff_service.review_request("req-1", data, supervisor_id="sup-1")
    assert result.status == "APPROVED"


@pytest.mark.asyncio
async def test_review_request_reject(mock_db):
    mock_db.timeoffrequest.find_unique.return_value = make_request(status="PENDING")
    mock_db.timeoffrequest.update.return_value = make_request(status="REJECTED")

    data = TimeOffReview(status="REJECTED", approval_notes="Insufficient notice")
    result = await timeoff_service.review_request("req-1", data, supervisor_id="sup-1")
    assert result.status == "REJECTED"


@pytest.mark.asyncio
async def test_review_request_not_found(mock_db):
    mock_db.timeoffrequest.find_unique.return_value = None
    data = TimeOffReview(status="APPROVED")
    with pytest.raises(HTTPException) as exc:
        await timeoff_service.review_request("bad-id", data, supervisor_id="sup-1")
    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_review_request_already_reviewed(mock_db):
    mock_db.timeoffrequest.find_unique.return_value = make_request(status="APPROVED")
    data = TimeOffReview(status="REJECTED")
    with pytest.raises(HTTPException) as exc:
        await timeoff_service.review_request("req-1", data, supervisor_id="sup-1")
    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_review_request_invalid_status(mock_db):
    mock_db.timeoffrequest.find_unique.return_value = make_request(status="PENDING")
    data = TimeOffReview(status="CANCELLED")
    with pytest.raises(HTTPException) as exc:
        await timeoff_service.review_request("req-1", data, supervisor_id="sup-1")
    assert exc.value.status_code == 400
