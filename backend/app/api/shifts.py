from fastapi import APIRouter, Depends
from typing import List, Optional

from app.schemas.shift import (
    ShiftCreate,
    ShiftUpdate,
    ShiftResponse,
    AssignWorkerRequest,
    AssignmentResponse,
)
from app.services import shift_service
from app.utils.dependencies import require_supervisor, require_any_role

router = APIRouter(prefix="/shifts", tags=["Shifts"])


@router.post("", response_model=ShiftResponse, status_code=201)
async def create_shift(
    data: ShiftCreate,
    current_user: dict = Depends(require_supervisor),
):
    """Supervisor creates a new shift."""
    return await shift_service.create_shift(data, supervisor_id=current_user["user_id"])


@router.get("", response_model=List[ShiftResponse])
async def list_shifts(
    supervisor_id: Optional[str] = None,
    current_user: dict = Depends(require_any_role),
):
    """List all shifts. Supervisors/admins can filter by supervisor_id."""
    return await shift_service.list_shifts(supervisor_id=supervisor_id)


@router.get("/{shift_id}", response_model=ShiftResponse)
async def get_shift(
    shift_id: str,
    current_user: dict = Depends(require_any_role),
):
    """Get a single shift by ID."""
    return await shift_service.get_shift(shift_id)


@router.patch("/{shift_id}", response_model=ShiftResponse)
async def update_shift(
    shift_id: str,
    data: ShiftUpdate,
    current_user: dict = Depends(require_supervisor),
):
    """Update a shift (supervisor only)."""
    return await shift_service.update_shift(shift_id, data)


@router.delete("/{shift_id}")
async def delete_shift(
    shift_id: str,
    current_user: dict = Depends(require_supervisor),
):
    """Delete a shift (supervisor only)."""
    return await shift_service.delete_shift(shift_id)


@router.post("/{shift_id}/assign", response_model=AssignmentResponse, status_code=201)
async def assign_worker(
    shift_id: str,
    data: AssignWorkerRequest,
    current_user: dict = Depends(require_supervisor),
):
    """Assign a worker to a shift (supervisor only)."""
    return await shift_service.assign_worker(
        shift_id=shift_id,
        worker_id=data.worker_id,
        supervisor_id=current_user["user_id"],
    )
