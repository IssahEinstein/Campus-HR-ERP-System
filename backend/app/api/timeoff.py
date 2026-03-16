from fastapi import APIRouter, Depends
from typing import List

from app.schemas.timeoff import TimeOffCreate, TimeOffReview, TimeOffResponse
from app.services import timeoff_service
from app.utils.dependencies import require_worker, require_supervisor, require_any_role

router = APIRouter(prefix="/time-off", tags=["Time-Off"])


@router.post("", response_model=TimeOffResponse, status_code=201)
async def submit_request(
    data: TimeOffCreate,
    current_user: dict = Depends(require_worker),
):
    """Worker submits a time-off request."""
    return await timeoff_service.submit_request(data, worker_id=current_user["user_id"])


@router.patch("/{request_id}/cancel", response_model=TimeOffResponse)
async def cancel_request(
    request_id: str,
    current_user: dict = Depends(require_worker),
):
    """Worker cancels their own pending time-off request."""
    return await timeoff_service.cancel_request(request_id, worker_id=current_user["user_id"])


@router.patch("/{request_id}/review", response_model=TimeOffResponse)
async def review_request(
    request_id: str,
    data: TimeOffReview,
    current_user: dict = Depends(require_supervisor),
):
    """Supervisor approves or rejects a time-off request."""
    return await timeoff_service.review_request(
        request_id, data, supervisor_id=current_user["user_id"]
    )


@router.get("/pending", response_model=List[TimeOffResponse])
async def list_pending(
    current_user: dict = Depends(require_supervisor),
):
    """Supervisor views all pending time-off requests."""
    return await timeoff_service.list_pending_requests()


@router.get("/me", response_model=List[TimeOffResponse])
async def my_requests(
    current_user: dict = Depends(require_worker),
):
    """Worker views their own time-off requests."""
    return await timeoff_service.list_requests_for_worker(worker_id=current_user["user_id"])


@router.get("/worker/{worker_id}", response_model=List[TimeOffResponse])
async def requests_for_worker(
    worker_id: str,
    current_user: dict = Depends(require_supervisor),
):
    """Supervisor views all time-off requests for a specific worker."""
    return await timeoff_service.list_requests_for_worker(worker_id)


@router.get("/{request_id}", response_model=TimeOffResponse)
async def get_request(
    request_id: str,
    current_user: dict = Depends(require_any_role),
):
    """Get a single time-off request by ID."""
    return await timeoff_service.get_request(request_id)
