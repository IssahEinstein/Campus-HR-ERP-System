from typing import Annotated

from fastapi import APIRouter, Depends

from app.auth.authorization import ensure_shift_belongs_to_supervisor, ensure_supervisor_owns_worker
from app.auth.dependencies import require_role
from app.db import get_db
from app.schemas.auth import CurrentUser
from app.schemas.shift import AssignmentResponse, AssignWorkerRequest, ShiftCreate, ShiftResponse, ShiftUpdate
from app.services import shift_service

router = APIRouter(prefix="/shifts", tags=["Shifts"])
_db = get_db()


@router.post("", status_code=201, response_model=ShiftResponse)
async def create_shift(
    body: ShiftCreate,
    current_user: Annotated[CurrentUser, Depends(require_role("SUPERVISOR"))],
):
    """Supervisor creates a new shift."""
    return await shift_service.create_shift(body, supervisor_id=current_user.profile_id)


@router.get("", response_model=list[ShiftResponse])
async def list_shifts(
    current_user: Annotated[CurrentUser, Depends(require_role("SUPERVISOR", "ADMIN"))],
):
    """
    Admin sees all shifts.
    Supervisor sees only shifts they created.
    """
    if current_user.role == "ADMIN":
        return await shift_service.list_shifts()
    return await shift_service.list_shifts(supervisor_id=current_user.profile_id)


@router.get("/my-assignments", response_model=list[AssignmentResponse])
async def my_shift_assignments(
    current_user: Annotated[CurrentUser, Depends(require_role("WORKER"))],
):
    """Worker views all their shift assignments."""
    return await _db.shiftassignment.find_many(
        where={"workerId": current_user.profile_id},
        include={"shift": True},
        order={"createdAt": "desc"},
    )


@router.get("/{shift_id}", response_model=ShiftResponse)
async def get_shift(
    shift_id: str,
    current_user: Annotated[CurrentUser, Depends(require_role("SUPERVISOR", "ADMIN"))],
):
    """Supervisor views one of their shifts. Admin can view any shift."""
    if current_user.role == "SUPERVISOR":
        await ensure_shift_belongs_to_supervisor(current_user.profile_id, shift_id)
    return await shift_service.get_shift(shift_id)


@router.put("/{shift_id}", response_model=ShiftResponse)
async def update_shift(
    shift_id: str,
    body: ShiftUpdate,
    current_user: Annotated[CurrentUser, Depends(require_role("SUPERVISOR"))],
):
    """Supervisor updates one of their own shifts."""
    await ensure_shift_belongs_to_supervisor(current_user.profile_id, shift_id)
    return await shift_service.update_shift(shift_id, body)


@router.delete("/{shift_id}", status_code=204)
async def delete_shift(
    shift_id: str,
    current_user: Annotated[CurrentUser, Depends(require_role("SUPERVISOR"))],
):
    """Supervisor deletes one of their own shifts."""
    await ensure_shift_belongs_to_supervisor(current_user.profile_id, shift_id)
    await shift_service.delete_shift(shift_id)


@router.post("/{shift_id}/assign", status_code=201, response_model=AssignmentResponse)
async def assign_worker(
    shift_id: str,
    body: AssignWorkerRequest,
    current_user: Annotated[CurrentUser, Depends(require_role("SUPERVISOR"))],
):
    """Supervisor assigns a worker (from their department) to one of their shifts."""
    await ensure_shift_belongs_to_supervisor(current_user.profile_id, shift_id)
    await ensure_supervisor_owns_worker(current_user.profile_id, body.worker_id)
    return await shift_service.assign_worker(shift_id, body.worker_id, current_user.profile_id)
