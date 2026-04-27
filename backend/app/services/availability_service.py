from datetime import datetime

from fastapi import HTTPException

from app.db import get_db
from app.schemas.availability import AvailabilityCreate, AvailabilityUpdate


db = get_db()


async def set_availability(data: AvailabilityCreate, worker_id: str):
    """Worker sets an availability slot for a given day of the week."""
    worker = await db.worker.find_unique(where={"id": worker_id})
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    # Prevent overlapping slots on the same day
    existing = await db.availability.find_many(where={"workerId": worker_id, "dayOfWeek": data.day_of_week})
    new_start_minutes = _time_text_to_minutes(data.start_time)
    new_end_minutes = _time_text_to_minutes(data.end_time)
    for slot in existing:
        slot_start_minutes = _time_text_to_minutes(slot.startTime)
        slot_end_minutes = _time_text_to_minutes(slot.endTime)
        if not (new_end_minutes <= slot_start_minutes or new_start_minutes >= slot_end_minutes):
            raise HTTPException(
                status_code=409,
                detail=f"Overlaps with an existing availability slot on day {data.day_of_week}",
            )

    return await db.availability.create(
        data={
            "workerId": worker_id,
            "dayOfWeek": data.day_of_week,
            "startTime": data.start_time,
            "endTime": data.end_time,
        }
    )


async def list_availability_for_worker(worker_id: str):
    """List all availability slots for a worker ordered by day then time."""
    return await db.availability.find_many(
        where={"workerId": worker_id},
        order=[{"dayOfWeek": "asc"}, {"startTime": "asc"}],
    )


async def get_availability(availability_id: str):
    """Fetch a single availability slot."""
    slot = await db.availability.find_unique(where={"id": availability_id})
    if not slot:
        raise HTTPException(status_code=404, detail="Availability slot not found")
    return slot


async def update_availability(availability_id: str, data: AvailabilityUpdate, worker_id: str):
    """Worker updates an availability slot they own."""
    slot = await db.availability.find_unique(where={"id": availability_id})
    if not slot:
        raise HTTPException(status_code=404, detail="Availability slot not found")
    if slot.workerId != worker_id:
        raise HTTPException(status_code=403, detail="This slot does not belong to you")

    update_data = {}
    if data.start_time is not None:
        update_data["startTime"] = data.start_time
    if data.end_time is not None:
        update_data["endTime"] = data.end_time

    new_start = update_data.get("startTime", slot.startTime)
    new_end = update_data.get("endTime", slot.endTime)
    if _time_text_to_minutes(new_end) <= _time_text_to_minutes(new_start):
        raise HTTPException(status_code=422, detail="end_time must be after start_time")

    return await db.availability.update(where={"id": availability_id}, data=update_data)


async def delete_availability(availability_id: str, worker_id: str):
    """Worker deletes an availability slot they own."""
    slot = await db.availability.find_unique(where={"id": availability_id})
    if not slot:
        raise HTTPException(status_code=404, detail="Availability slot not found")
    if slot.workerId != worker_id:
        raise HTTPException(status_code=403, detail="This slot does not belong to you")

    await db.availability.delete(where={"id": availability_id})
    return {"detail": "Availability slot deleted"}


def _time_text_to_minutes(value: str) -> int:
    text = " ".join(str(value or "").strip().split())
    candidates = [
        "%H:%M",
        "%H:%M:%S",
        "%I:%M %p",
        "%I:%M:%S %p",
    ]

    for fmt in candidates:
        try:
            parsed = datetime.strptime(text, fmt)
            return (parsed.hour * 60) + parsed.minute
        except ValueError:
            continue

    raise HTTPException(status_code=422, detail=f"Invalid time value: {value}")
