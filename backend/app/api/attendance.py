from typing import Annotated

from fastapi import APIRouter, Depends

from app.auth.authorization import ensure_supervisor_owns_worker
from app.auth.dependencies import require_role
from app.schemas.attendance import AttendanceResponse, CheckInRequest, CheckOutRequest
from app.schemas.auth import CurrentUser
from app.services import attendance_service

router = APIRouter(prefix="/attendance", tags=["Attendance"])


@router.post("/check-in", status_code=201, response_model=AttendanceResponse)
async def check_in(
    body: CheckInRequest,
    current_user: Annotated[CurrentUser, Depends(require_role("WORKER"))],
):
    """Worker checks in for a shift assignment."""
    return await attendance_service.check_in(body, worker_id=current_user.profile_id)


@router.post("/check-out/{record_id}", response_model=AttendanceResponse)
async def check_out(
    record_id: str,
    body: CheckOutRequest,
    current_user: Annotated[CurrentUser, Depends(require_role("WORKER"))],
):
    """Worker checks out of a shift."""
    return await attendance_service.check_out(
        record_id, worker_id=current_user.profile_id, notes=body.notes
    )


@router.get("/my", response_model=list[AttendanceResponse])
async def my_attendance(
    current_user: Annotated[CurrentUser, Depends(require_role("WORKER"))],
):
    """Worker views their own attendance records."""
    return await attendance_service.list_records_for_worker(worker_id=current_user.profile_id)


@router.get("/worker/{worker_id}", response_model=list[AttendanceResponse])
async def worker_attendance(
    worker_id: str,
    current_user: Annotated[CurrentUser, Depends(require_role("SUPERVISOR", "ADMIN"))],
):
    """
    Supervisor views attendance for a worker in their department.
    Admin can view any worker's attendance.
    """
    if current_user.role == "SUPERVISOR":
        await ensure_supervisor_owns_worker(current_user.profile_id, worker_id)
    return await attendance_service.list_records_for_worker(worker_id)


@router.get("/{record_id}", response_model=AttendanceResponse)
async def get_record(
    record_id: str,
    current_user: Annotated[CurrentUser, Depends(require_role("SUPERVISOR", "ADMIN"))],
):
    """Supervisor or Admin fetches a single attendance record."""
    return await attendance_service.get_record(record_id)
