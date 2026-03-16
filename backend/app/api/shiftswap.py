from fastapi import APIRouter, Depends
from typing import List

from app.schemas.shiftswap import ShiftSwapCreate, ShiftSwapReview, ShiftSwapResponse
from app.services import shiftswap_service
from app.utils.dependencies import require_worker, require_supervisor, require_any_role

router = APIRouter(prefix="/shiftswaps", tags=["ShiftSwap"])


@router.post("", response_model=ShiftSwapResponse, status_code=201)
async def submit_swap_request(
    data: ShiftSwapCreate,
    current_user: dict = Depends(require_worker),
):
    """Worker submits a shift swap request."""
    return await shiftswap_service.submit_swap_request(data, worker_id=current_user["user_id"])


@router.post("/{request_id}/cancel", response_model=ShiftSwapResponse)
async def cancel_swap_request(
    request_id: str,
    current_user: dict = Depends(require_worker),
):
    """Worker cancels their own pending swap request."""
    return await shiftswap_service.cancel_swap_request(request_id, worker_id=current_user["user_id"])


@router.post("/{request_id}/review", response_model=ShiftSwapResponse)
async def review_swap_request(
    request_id: str,
    data: ShiftSwapReview,
    current_user: dict = Depends(require_supervisor),
):
    """Supervisor approves or rejects a swap request."""
    return await shiftswap_service.review_swap_request(
        request_id, data, supervisor_id=current_user["user_id"]
    )


@router.get("/worker/{worker_id}", response_model=List[ShiftSwapResponse])
async def list_swap_requests_for_worker(
    worker_id: str,
    current_user: dict = Depends(require_any_role),
):
    """List all swap requests involving a worker (as initiator or target)."""
    return await shiftswap_service.list_swap_requests_for_worker(worker_id)


@router.get("/pending", response_model=List[ShiftSwapResponse])
async def list_pending_swaps(
    current_user: dict = Depends(require_supervisor),
):
    """Supervisor view of all pending swap requests."""
    return await shiftswap_service.list_pending_swaps()


@router.get("/{request_id}", response_model=ShiftSwapResponse)
async def get_swap_request(
    request_id: str,
    current_user: dict = Depends(require_any_role),
):
    """Get a single swap request by ID."""
    return await shiftswap_service.get_swap_request(request_id)
