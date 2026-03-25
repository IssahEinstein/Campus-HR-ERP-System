from datetime import datetime
from typing import Optional
from fastapi import HTTPException

from app.db import db
from app.schemas.shift import ShiftCreate, ShiftUpdate


async def create_shift(data: ShiftCreate, supervisor_id: str):
    """Supervisor creates a new shift."""
    # Verify the supervisor exists
    supervisor = await db.supervisor.find_unique(where={"id": supervisor_id})
    if not supervisor:
        raise HTTPException(status_code=404, detail="Supervisor not found")

    shift = await db.shift.create(
        data={
            "supervisorId": supervisor_id,
            "title": data.title,
            "description": data.description,
            "location": data.location,
            "startTime": data.start_time,
            "endTime": data.end_time,
            "expectedHours": data.expected_hours,
        }
    )
    return shift


async def get_shift(shift_id: str):
    """Fetch a single shift by ID."""
    shift = await db.shift.find_unique(
        where={"id": shift_id},
        include={"assignments": True},
    )
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    return shift


async def list_shifts(supervisor_id: Optional[str] = None):
    """List shifts. Optionally filter by supervisor."""
    where = {}
    if supervisor_id:
        where["supervisorId"] = supervisor_id

    shifts = await db.shift.find_many(
        where=where,
        order={"startTime": "asc"},
    )
    return shifts


async def update_shift(shift_id: str, data: ShiftUpdate):
    """Update shift fields. Only include fields that were provided."""
    shift = await db.shift.find_unique(where={"id": shift_id})
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")

    update_data = data.model_dump(exclude_none=True)
    if not update_data:
        return shift  # nothing to update

    # Map snake_case to Prisma camelCase
    field_map = {
        "start_time": "startTime",
        "end_time": "endTime",
        "expected_hours": "expectedHours",
    }
    mapped = {}
    for key, value in update_data.items():
        prisma_key = field_map.get(key, key)
        # Convert enum to its value string
        mapped[prisma_key] = value.value if hasattr(value, "value") else value

    updated = await db.shift.update(where={"id": shift_id}, data=mapped)
    return updated


async def delete_shift(shift_id: str):
    """Delete a shift. Cascades to assignments via Prisma schema."""
    shift = await db.shift.find_unique(where={"id": shift_id})
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")

    await db.shift.delete(where={"id": shift_id})
    return {"message": "Shift deleted successfully"}


async def assign_worker(shift_id: str, worker_id: str, supervisor_id: str):
    """Assign a worker to a shift with overlap and status validation."""
    shift = await db.shift.find_unique(where={"id": shift_id})
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")

    # Validate worker is ACTIVE
    await _validate_worker_active(worker_id)

    # Validate no overlapping shift assignment
    await _validate_no_overlap(worker_id, shift.startTime, shift.endTime, exclude_shift_id=shift_id)

    # Check the worker isn't already assigned to this shift
    existing = await db.shiftassignment.find_first(
        where={"shiftId": shift_id, "workerId": worker_id}
    )
    if existing:
        raise HTTPException(status_code=409, detail="Worker is already assigned to this shift")

    assignment = await db.shiftassignment.create(
        data={
            "shiftId": shift_id,
            "workerId": worker_id,
            "assignedById": supervisor_id,
        }
    )
    return assignment


async def _validate_worker_active(worker_id: str):
    """Raise 400 if the worker doesn't exist or is not ACTIVE."""
    worker = await db.worker.find_unique(where={"id": worker_id})
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    if worker.status != "ACTIVE":
        raise HTTPException(
            status_code=400,
            detail=f"Worker is not active (current status: {worker.status})"
        )


async def _validate_no_overlap(
    worker_id: str,
    start_time: datetime,
    end_time: datetime,
    exclude_shift_id: Optional[str] = None,
):
    """
    Check that the worker has no existing ASSIGNED shift that overlaps
    with [start_time, end_time]. Two shifts overlap when:
        existing.startTime < new.endTime AND existing.endTime > new.startTime
    """
    overlapping = await db.shiftassignment.find_many(
        where={
            "workerId": worker_id,
            "status": "ASSIGNED",
            "shift": {
                "startTime": {"lt": end_time},
                "endTime": {"gt": start_time},
            },
        },
        include={"shift": True},
    )

    # Exclude the current shift itself (for update scenarios)
    if exclude_shift_id:
        overlapping = [a for a in overlapping if a.shiftId != exclude_shift_id]

    if overlapping:
        raise HTTPException(
            status_code=409,
            detail="Worker already has an overlapping shift assignment during this time"
        )
