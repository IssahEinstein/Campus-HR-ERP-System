import pytest
from unittest.mock import MagicMock
from fastapi import HTTPException
from datetime import datetime, timezone

from app.services import availability_service
from app.schemas.availability import AvailabilityCreate, AvailabilityUpdate


def make_slot(**kwargs):
    s = MagicMock()
    s.id = kwargs.get("id", "slot-1")
    s.workerId = kwargs.get("workerId", "worker-1")
    s.dayOfWeek = kwargs.get("dayOfWeek", 1)
    s.startTime = kwargs.get("startTime", "09:00")
    s.endTime = kwargs.get("endTime", "17:00")
    s.createdAt = kwargs.get("createdAt", datetime(2026, 3, 10, tzinfo=timezone.utc))
    return s


def make_worker(worker_id="worker-1"):
    w = MagicMock()
    w.id = worker_id
    return w


# ── set_availability ──────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_set_availability_success(mock_db):
    mock_db.worker.find_unique.return_value = make_worker()
    mock_db.availability.find_many.return_value = []
    mock_db.availability.create.return_value = make_slot()

    data = AvailabilityCreate(day_of_week=1, start_time="09:00", end_time="17:00")
    result = await availability_service.set_availability(data, worker_id="worker-1")
    assert result.id == "slot-1"
    mock_db.availability.create.assert_called_once()


@pytest.mark.asyncio
async def test_set_availability_worker_not_found(mock_db):
    mock_db.worker.find_unique.return_value = None

    data = AvailabilityCreate(day_of_week=1, start_time="09:00", end_time="17:00")
    with pytest.raises(HTTPException) as exc:
        await availability_service.set_availability(data, worker_id="bad-id")
    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_set_availability_overlap(mock_db):
    mock_db.worker.find_unique.return_value = make_worker()
    # Existing slot 08:00–12:00 overlaps with new slot 09:00–17:00
    mock_db.availability.find_many.return_value = [make_slot(startTime="08:00", endTime="12:00")]

    data = AvailabilityCreate(day_of_week=1, start_time="09:00", end_time="17:00")
    with pytest.raises(HTTPException) as exc:
        await availability_service.set_availability(data, worker_id="worker-1")
    assert exc.value.status_code == 409


@pytest.mark.asyncio
async def test_set_availability_no_overlap_adjacent(mock_db):
    """Slots on the same day that don't overlap should succeed."""
    mock_db.worker.find_unique.return_value = make_worker()
    # Existing slot 08:00–09:00, new slot 09:00–17:00 — adjacent, no overlap
    mock_db.availability.find_many.return_value = [make_slot(startTime="08:00", endTime="09:00")]
    mock_db.availability.create.return_value = make_slot()

    data = AvailabilityCreate(day_of_week=1, start_time="09:00", end_time="17:00")
    result = await availability_service.set_availability(data, worker_id="worker-1")
    assert result.id == "slot-1"


# ── list / get ────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_list_availability_for_worker(mock_db):
    mock_db.availability.find_many.return_value = [make_slot(), make_slot(id="slot-2", dayOfWeek=2)]
    result = await availability_service.list_availability_for_worker("worker-1")
    assert len(result) == 2


@pytest.mark.asyncio
async def test_get_availability_found(mock_db):
    mock_db.availability.find_unique.return_value = make_slot()
    result = await availability_service.get_availability("slot-1")
    assert result.id == "slot-1"


@pytest.mark.asyncio
async def test_get_availability_not_found(mock_db):
    mock_db.availability.find_unique.return_value = None
    with pytest.raises(HTTPException) as exc:
        await availability_service.get_availability("bad-id")
    assert exc.value.status_code == 404


# ── update_availability ───────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_update_availability_success(mock_db):
    slot = make_slot()
    updated = make_slot(endTime="18:00")
    mock_db.availability.find_unique.return_value = slot
    mock_db.availability.update.return_value = updated

    data = AvailabilityUpdate(end_time="18:00")
    result = await availability_service.update_availability("slot-1", data, worker_id="worker-1")
    assert result.endTime == "18:00"


@pytest.mark.asyncio
async def test_update_availability_wrong_worker(mock_db):
    mock_db.availability.find_unique.return_value = make_slot(workerId="other-worker")
    data = AvailabilityUpdate(end_time="18:00")
    with pytest.raises(HTTPException) as exc:
        await availability_service.update_availability("slot-1", data, worker_id="worker-1")
    assert exc.value.status_code == 403


# ── delete_availability ───────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_delete_availability_success(mock_db):
    mock_db.availability.find_unique.return_value = make_slot()
    result = await availability_service.delete_availability("slot-1", worker_id="worker-1")
    assert result["detail"] == "Availability slot deleted"
    mock_db.availability.delete.assert_called_once()


@pytest.mark.asyncio
async def test_delete_availability_not_found(mock_db):
    mock_db.availability.find_unique.return_value = None
    with pytest.raises(HTTPException) as exc:
        await availability_service.delete_availability("bad-id", worker_id="worker-1")
    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_delete_availability_wrong_worker(mock_db):
    mock_db.availability.find_unique.return_value = make_slot(workerId="other-worker")
    with pytest.raises(HTTPException) as exc:
        await availability_service.delete_availability("slot-1", worker_id="worker-1")
    assert exc.value.status_code == 403
