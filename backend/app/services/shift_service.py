from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import uuid4
from fastapi import HTTPException

from app.db import get_db
from app.schemas.shift import ShiftCreate, ShiftUpdate


db = get_db()


async def create_shift(data: ShiftCreate, supervisor_id: str):
    """Supervisor creates a new shift."""
    # Verify the supervisor exists
    supervisor = await db.supervisor.find_unique(where={"id": supervisor_id})
    if not supervisor:
        raise HTTPException(status_code=404, detail="Supervisor not found")

    computed_expected_hours = _calculate_expected_hours(data.start_time, data.end_time)

    if not data.repeat_weekly:
        return await db.shift.create(
            data={
                "supervisorId": supervisor_id,
                "title": data.title,
                "description": data.description,
                "location": data.location,
                "startTime": data.start_time,
                "endTime": data.end_time,
                "expectedHours": computed_expected_hours,
                "isRecurring": False,
            }
        )

    semester_settings = None
    recurrence_end = data.repeat_end_date
    if recurrence_end is None:
        rows = await db.query_raw(
            'SELECT "semesterStartDate", "semesterEndDate" FROM "SemesterSetting" WHERE "key" = \'default\' LIMIT 1'
        )
        if not rows:
            raise HTTPException(
                status_code=400,
                detail="Semester dates are not configured. Ask an admin to set them first.",
            )
        semester_settings = rows[0]
        recurrence_end = semester_settings["semesterEndDate"]

    if recurrence_end <= data.start_time:
        raise HTTPException(status_code=400, detail="repeat_end_date must be after start_time")

    first_start = data.start_time
    if semester_settings is not None:
        first_start = _first_occurrence_with_weekday_and_time(
            semester_settings["semesterStartDate"],
            data.start_time,
        )
        if first_start < data.start_time:
            first_start = data.start_time

    duration = data.end_time - data.start_time
    recurrence_group_id = uuid4().hex

    created_shift = None
    occurrence_start = first_start
    while occurrence_start <= recurrence_end:
        occurrence_end = occurrence_start + duration
        created = await db.shift.create(
            data={
                "supervisorId": supervisor_id,
                "title": data.title,
                "description": data.description,
                "location": data.location,
                "startTime": occurrence_start,
                "endTime": occurrence_end,
                "expectedHours": computed_expected_hours,
                "isRecurring": True,
                "recurrenceGroupId": recurrence_group_id,
            }
        )
        if created_shift is None:
            created_shift = created
        occurrence_start = occurrence_start + timedelta(days=7)

    if created_shift is None:
        raise HTTPException(status_code=400, detail="No recurring shifts were generated")

    return created_shift


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

    updated_start_time = update_data.get("start_time", shift.startTime)
    updated_end_time = update_data.get("end_time", shift.endTime)
    computed_expected_hours = _calculate_expected_hours(updated_start_time, updated_end_time)

    # expected_hours is derived from start/end and cannot be manually overridden.
    update_data.pop("expected_hours", None)

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

    mapped["expectedHours"] = computed_expected_hours

    updated = await db.shift.update(where={"id": shift_id}, data=mapped)
    return updated


def _calculate_expected_hours(start_time: datetime, end_time: datetime) -> float:
    if end_time <= start_time:
        raise HTTPException(status_code=400, detail="Shift end time must be after start time")
    hours = (end_time - start_time).total_seconds() / 3600
    return round(hours, 2)


async def delete_shift(shift_id: str):
    """Delete a shift. Cascades to assignments via Prisma schema."""
    shift = await db.shift.find_unique(where={"id": shift_id})
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")

    await db.shift.delete(where={"id": shift_id})
    return {"message": "Shift deleted successfully"}


async def assign_worker(
    shift_id: str,
    worker_id: str,
    supervisor_id: str,
    apply_to_series: bool = False,
):
    """Assign a worker to a shift with overlap and status validation."""
    shift = await db.shift.find_unique(where={"id": shift_id})
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")

    target_shifts = [shift]
    if apply_to_series and shift.recurrenceGroupId:
        target_shifts = await db.shift.find_many(
            where={
                "recurrenceGroupId": shift.recurrenceGroupId,
                "startTime": {"gte": shift.startTime},
            },
            order={"startTime": "asc"},
        )
        if not target_shifts:
            target_shifts = [shift]

    # Validate all target shifts first to avoid partial writes.
    for target_shift in target_shifts:
        await validate_worker_for_shift(
            worker_id,
            target_shift.startTime,
            target_shift.endTime,
            exclude_shift_ids={target_shift.id},
        )

    created_assignment = None
    for target_shift in target_shifts:
        existing = await db.shiftassignment.find_first(
            where={"shiftId": target_shift.id, "workerId": worker_id}
        )
        if existing:
            if target_shift.id == shift_id:
                raise HTTPException(status_code=409, detail="Worker is already assigned to this shift")
            continue

        assignment = await db.shiftassignment.create(
            data={
                "shiftId": target_shift.id,
                "workerId": worker_id,
                "assignedById": supervisor_id,
            }
        )
        if target_shift.id == shift_id:
            created_assignment = assignment

    if created_assignment is None:
        created_assignment = await db.shiftassignment.find_first(
            where={"shiftId": shift_id, "workerId": worker_id}
        )
    return created_assignment


async def validate_worker_for_shift(
    worker_id: str,
    start_time: datetime,
    end_time: datetime,
    exclude_shift_ids: Optional[set[str]] = None,
):
    """Validate worker assignment eligibility for a specific shift time window."""
    await _validate_worker_active(worker_id)
    await _validate_worker_availability_and_time_off(worker_id, start_time, end_time)
    await _validate_no_overlap(
        worker_id,
        start_time,
        end_time,
        exclude_shift_ids=exclude_shift_ids,
    )


async def create_shift_assignment(
    shift_id: str,
    worker_id: str,
    assigned_by_id: str,
):
    """Create a single shift assignment record."""
    return await db.shiftassignment.create(
        data={
            "shiftId": shift_id,
            "workerId": worker_id,
            "assignedById": assigned_by_id,
        }
    )


async def list_worker_assignments(worker_id: str):
    """List assignments for a worker and include the latest attendance record.

    Also auto-checks out overdue open attendance records at shift end time.
    """
    assignments = await db.shiftassignment.find_many(
        where={"workerId": worker_id},
        include={
            "shift": True,
            "checkInOuts": {"order": {"checkedInAt": "desc"}},
        },
        order={"createdAt": "desc"},
    )

    now_utc = datetime.now(timezone.utc)
    results = []

    for assignment in assignments:
        records = list(assignment.checkInOuts or [])
        open_record = next((r for r in records if r.checkedOutAt is None), None)

        if open_record and assignment.shift and now_utc >= assignment.shift.endTime:
            auto_checkout_at = assignment.shift.endTime
            if auto_checkout_at < open_record.checkedInAt:
                auto_checkout_at = open_record.checkedInAt

            auto_hours = round(
                (auto_checkout_at - open_record.checkedInAt).total_seconds() / 3600,
                2,
            )

            updated_record = await db.checkinout.update(
                where={"id": open_record.id},
                data={
                    "checkedOutAt": auto_checkout_at,
                    "hoursWorked": auto_hours,
                },
            )
            records = [updated_record if r.id == open_record.id else r for r in records]

        latest_record = records[0] if records else None
        latest_record_dict = None
        if latest_record:
            latest_record_dict = {
                "id": latest_record.id,
                "worker_id": latest_record.workerId,
                "shift_assignment_id": latest_record.shiftAssignmentId,
                "checked_in_at": latest_record.checkedInAt,
                "checked_out_at": latest_record.checkedOutAt,
                "hours_worked": latest_record.hoursWorked,
                "notes": latest_record.notes,
            }
        results.append(
            {
                "id": assignment.id,
                "shift_id": assignment.shiftId,
                "worker_id": assignment.workerId,
                "assigned_by_id": assignment.assignedById,
                "status": assignment.status,
                "created_at": assignment.createdAt,
                "shift": assignment.shift,
                "check_in_record": latest_record_dict,
            }
        )

    return results


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
    exclude_shift_ids: Optional[set[str]] = None,
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

    # Exclude provided shifts from overlap checks (for reassignment/swap scenarios).
    excluded = set(exclude_shift_ids or set())
    if exclude_shift_id:
        excluded.add(exclude_shift_id)
    if excluded:
        overlapping = [a for a in overlapping if a.shiftId not in excluded]

    if overlapping:
        raise HTTPException(
            status_code=409,
            detail="Worker already has an overlapping shift assignment during this time"
        )


def _first_occurrence_with_weekday_and_time(
    semester_start: datetime,
    anchor_start: datetime,
) -> datetime:
    """Get first datetime on/after semester_start matching anchor weekday/time."""
    anchor_weekday = anchor_start.weekday()
    days_ahead = (anchor_weekday - semester_start.weekday()) % 7
    candidate_date = (semester_start + timedelta(days=days_ahead)).date()

    candidate = datetime.combine(
        candidate_date,
        anchor_start.timetz().replace(tzinfo=None),
        tzinfo=semester_start.tzinfo,
    )
    if candidate < semester_start:
        candidate += timedelta(days=7)
    return candidate


async def _validate_worker_availability_and_time_off(
    worker_id: str,
    start_time: datetime,
    end_time: datetime,
):
    """Enforce assignment only within availability and outside approved time-off."""
    if end_time <= start_time:
        raise HTTPException(status_code=400, detail="Shift end time must be after start time")

    if start_time.date() != end_time.date():
        raise HTTPException(
            status_code=409,
            detail="Shift cannot be assigned across multiple days for availability validation",
        )

    day_of_week = start_time.weekday()  # Monday=0 ... Sunday=6
    shift_start_hm = start_time.strftime("%H:%M")
    shift_end_hm = end_time.strftime("%H:%M")

    availability = await db.availability.find_many(
        where={"workerId": worker_id, "dayOfWeek": day_of_week}
    )
    fits_availability = any(
        slot.startTime <= shift_start_hm and slot.endTime >= shift_end_hm
        for slot in availability
    )
    if not fits_availability:
        raise HTTPException(
            status_code=409,
            detail="Shift is outside the worker's availability window",
        )

    overlapping_approved_time_off = await db.timeoffrequest.find_first(
        where={
            "workerId": worker_id,
            "status": "APPROVED",
            "startDate": {"lt": end_time},
            "endDate": {"gt": start_time},
        }
    )
    if overlapping_approved_time_off is not None:
        raise HTTPException(
            status_code=409,
            detail="Shift overlaps an approved time-off request",
        )
