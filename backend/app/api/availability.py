from typing import Annotated

from fastapi import APIRouter, Depends

from app.auth.authorization import ensure_supervisor_owns_worker
from app.auth.dependencies import require_role
from app.schemas.auth import CurrentUser
from app.schemas.availability import AvailabilityCreate, AvailabilityUpdate
from app.services import availability_service

router = APIRouter(prefix="/availability", tags=["Availability"])


@router.post("", status_code=201)
async def set_availability(
    body: AvailabilityCreate,
    current_user: Annotated[CurrentUser, Depends(require_role("WORKER"))],
):
    """Worker sets an availability slot for a given day of the week."""
    return await availability_service.set_availability(body, worker_id=current_user.profile_id)


@router.get("/my")
async def my_availability(
    current_user: Annotated[CurrentUser, Depends(require_role("WORKER"))],
):
    """Worker views their own availability."""
    return await availability_service.list_availability_for_worker(
        worker_id=current_user.profile_id
    )


@router.get("/worker/{worker_id}")
async def worker_availability(
    worker_id: str,
    current_user: Annotated[CurrentUser, Depends(require_role("SUPERVISOR", "ADMIN"))],
):
    """
    Supervisor views availability for a worker in their department.
    Admin can view any worker's availability.
    """
    if current_user.role == "SUPERVISOR":
        await ensure_supervisor_owns_worker(current_user.profile_id, worker_id)
    return await availability_service.list_availability_for_worker(worker_id)


@router.put("/{availability_id}")
async def update_availability(
    availability_id: str,
    body: AvailabilityUpdate,
    current_user: Annotated[CurrentUser, Depends(require_role("WORKER"))],
):
    """Worker updates one of their own availability slots."""
    return await availability_service.update_availability(
        availability_id, body, worker_id=current_user.profile_id
    )


@router.delete("/{availability_id}", status_code=204)
async def delete_availability(
    availability_id: str,
    current_user: Annotated[CurrentUser, Depends(require_role("WORKER"))],
):
    """Worker deletes one of their own availability slots."""
    await availability_service.delete_availability(
        availability_id, worker_id=current_user.profile_id
    )
