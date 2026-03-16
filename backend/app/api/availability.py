from fastapi import APIRouter, Depends
from typing import List

from app.schemas.availability import AvailabilityCreate, AvailabilityUpdate, AvailabilityResponse
from app.services import availability_service
from app.utils.dependencies import require_worker, require_any_role

router = APIRouter(prefix="/availability", tags=["Availability"])


@router.post("", response_model=AvailabilityResponse, status_code=201)
async def set_availability(
    data: AvailabilityCreate,
    current_user: dict = Depends(require_worker),
):
    """Worker sets an availability slot."""
    return await availability_service.set_availability(data, worker_id=current_user["user_id"])


@router.get("/worker/{worker_id}", response_model=List[AvailabilityResponse])
async def list_availability(
    worker_id: str,
    current_user: dict = Depends(require_any_role),
):
    """List all availability slots for a worker."""
    return await availability_service.list_availability_for_worker(worker_id)


@router.get("/{availability_id}", response_model=AvailabilityResponse)
async def get_availability(
    availability_id: str,
    current_user: dict = Depends(require_any_role),
):
    """Get a single availability slot."""
    return await availability_service.get_availability(availability_id)


@router.patch("/{availability_id}", response_model=AvailabilityResponse)
async def update_availability(
    availability_id: str,
    data: AvailabilityUpdate,
    current_user: dict = Depends(require_worker),
):
    """Worker updates their own availability slot."""
    return await availability_service.update_availability(
        availability_id, data, worker_id=current_user["user_id"]
    )


@router.delete("/{availability_id}")
async def delete_availability(
    availability_id: str,
    current_user: dict = Depends(require_worker),
):
    """Worker deletes their own availability slot."""
    return await availability_service.delete_availability(
        availability_id, worker_id=current_user["user_id"]
    )
