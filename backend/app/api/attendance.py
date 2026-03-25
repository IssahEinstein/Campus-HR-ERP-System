from fastapi import APIRouter, Depends
from typing import List

from app.schemas.attendance import CheckInRequest, CheckOutRequest, AttendanceResponse
from app.services import attendance_service
from app.utils.dependencies import require_worker, require_supervisor, require_any_role

router = APIRouter(prefix="/attendance", tags=["Attendance"])


@router.post("/check-in", response_model=AttendanceResponse, status_code=201)
async def check_in(
    data: CheckInRequest,
    current_user: dict = Depends(require_worker),
):
    """Worker checks in for a shift."""
    return await attendance_service.check_in(data, worker_id=current_user["user_id"])


@router.patch("/{record_id}/check-out", response_model=AttendanceResponse)
async def check_out(
    record_id: str,
    data: CheckOutRequest,
    current_user: dict = Depends(require_worker),
):
    """Worker checks out — hours worked calculated automatically."""
    return await attendance_service.check_out(
        record_id=record_id,
        worker_id=current_user["user_id"],
        notes=data.notes,
    )


@router.get("/me", response_model=List[AttendanceResponse])
async def my_attendance(
    current_user: dict = Depends(require_worker),
):
    """Worker views their own attendance history."""
    return await attendance_service.list_records_for_worker(worker_id=current_user["user_id"])


@router.get("/{record_id}", response_model=AttendanceResponse)
async def get_record(
    record_id: str,
    current_user: dict = Depends(require_any_role),
):
    """Get a single attendance record by ID."""
    return await attendance_service.get_record(record_id)


@router.get("/assignment/{shift_assignment_id}", response_model=List[AttendanceResponse])
async def records_for_assignment(
    shift_assignment_id: str,
    current_user: dict = Depends(require_supervisor),
):
    """Supervisor views all attendance records for a specific shift assignment."""
    return await attendance_service.list_records_for_assignment(shift_assignment_id)


@router.get("/worker/{worker_id}", response_model=List[AttendanceResponse])
async def records_for_worker(
    worker_id: str,
    current_user: dict = Depends(require_supervisor),
):
    """Supervisor views attendance history for any worker."""
    return await attendance_service.list_records_for_worker(worker_id)
