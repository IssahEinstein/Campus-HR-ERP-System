from datetime import datetime, timezone
from typing import Optional
from fastapi import HTTPException

from app.db import get_db
from app.schemas.attendance import CheckInRequest


db = get_db()


async def check_in(data: CheckInRequest, worker_id: str):
    """Worker checks in for a shift assignment."""
    # Verify the assignment exists and belongs to this worker
    assignment = await db.shiftassignment.find_unique(
        where={"id": data.shift_assignment_id},
        include={"shift": True},
    )
    if not assignment:
        raise HTTPException(status_code=404, detail="Shift assignment not found")
    if assignment.workerId != worker_id:
        raise HTTPException(status_code=403, detail="This assignment does not belong to you")

    # Prevent checking in if already checked in (open record exists)
    open_record = await db.checkinout.find_first(
        where={
            "workerId": worker_id,
            "shiftAssignmentId": data.shift_assignment_id,
            "checkedOutAt": None,
        }
    )
    if open_record:
        raise HTTPException(status_code=409, detail="You are already checked in for this shift")

    record = await db.checkinout.create(
        data={
            "workerId": worker_id,
            "shiftAssignmentId": data.shift_assignment_id,
            "checkedInAt": datetime.now(timezone.utc),
            "notes": data.notes,
        }
    )
    return record


async def check_out(record_id: str, worker_id: str, notes: Optional[str] = None):
    """Worker checks out — calculates hours worked automatically."""
    record = await db.checkinout.find_unique(where={"id": record_id})
    if not record:
        raise HTTPException(status_code=404, detail="Check-in record not found")
    if record.workerId != worker_id:
        raise HTTPException(status_code=403, detail="This record does not belong to you")
    if record.checkedOutAt is not None:
        raise HTTPException(status_code=409, detail="Already checked out")

    checked_out_at = datetime.now(timezone.utc)
    hours_worked = (checked_out_at - record.checkedInAt).total_seconds() / 3600

    updated = await db.checkinout.update(
        where={"id": record_id},
        data={
            "checkedOutAt": checked_out_at,
            "hoursWorked": round(hours_worked, 2),
            "notes": notes if notes is not None else record.notes,
        },
    )
    return updated


async def get_record(record_id: str):
    """Fetch a single attendance record."""
    record = await db.checkinout.find_unique(where={"id": record_id})
    if not record:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    return record


async def list_records_for_worker(worker_id: str):
    """List all attendance records for a specific worker."""
    return await db.checkinout.find_many(
        where={"workerId": worker_id},
        order={"checkedInAt": "desc"},
    )


async def list_records_for_assignment(shift_assignment_id: str):
    """List all attendance records for a specific shift assignment."""
    return await db.checkinout.find_many(
        where={"shiftAssignmentId": shift_assignment_id},
        order={"checkedInAt": "desc"},
    )
