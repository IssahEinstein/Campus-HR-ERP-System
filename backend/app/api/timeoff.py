from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.auth.authorization import ensure_supervisor_owns_worker
from app.auth.dependencies import require_role
from app.db import get_db
from app.schemas.auth import CurrentUser
from app.schemas.timeoff import TimeOffCreate, TimeOffResponse, TimeOffReview
from app.services import timeoff_service

router = APIRouter(prefix="/timeoff", tags=["Time-Off"])
_db = get_db()


@router.post("", status_code=201, response_model=TimeOffResponse)
async def submit_request(
    body: TimeOffCreate,
    current_user: Annotated[CurrentUser, Depends(require_role("WORKER"))],
):
    """Worker submits a time-off request."""
    return await timeoff_service.submit_request(body, worker_id=current_user.profile_id)


@router.post("/{request_id}/cancel", response_model=TimeOffResponse)
async def cancel_request(
    request_id: str,
    current_user: Annotated[CurrentUser, Depends(require_role("WORKER"))],
):
    """Worker cancels their own pending time-off request."""
    return await timeoff_service.cancel_request(request_id, worker_id=current_user.profile_id)


@router.get("/my", response_model=list[TimeOffResponse])
async def my_requests(
    current_user: Annotated[CurrentUser, Depends(require_role("WORKER"))],
):
    """Worker views their own time-off requests."""
    return await timeoff_service.list_requests_for_worker(worker_id=current_user.profile_id)


@router.get("/pending", response_model=list[TimeOffResponse])
async def pending_requests(
    current_user: Annotated[CurrentUser, Depends(require_role("SUPERVISOR", "ADMIN"))],
):
    """
    Admin sees all pending requests.
    Supervisor sees pending requests from workers in their department only.
    """
    all_pending = await timeoff_service.list_pending_requests()
    if current_user.role == "ADMIN":
        return all_pending

    supervisor = await _db.supervisor.find_unique(where={"id": current_user.profile_id})
    dept_worker_ids = {
        w.id
        for w in await _db.worker.find_many(where={"departmentId": supervisor.departmentId})
    }
    return [r for r in all_pending if r.workerId in dept_worker_ids]


@router.post("/{request_id}/review", response_model=TimeOffResponse)
async def review_request(
    request_id: str,
    body: TimeOffReview,
    current_user: Annotated[CurrentUser, Depends(require_role("SUPERVISOR", "ADMIN"))],
):
    """Supervisor or Admin approves/rejects a pending time-off request."""
    if current_user.role == "SUPERVISOR":
        req = await _db.timeoffrequest.find_unique(where={"id": request_id})
        if req:
            await ensure_supervisor_owns_worker(current_user.profile_id, req.workerId)
    return await timeoff_service.review_request(
        request_id, body, supervisor_id=current_user.profile_id
    )


@router.get("/{request_id}", response_model=TimeOffResponse)
async def get_request(
    request_id: str,
    current_user: Annotated[CurrentUser, Depends(require_role("WORKER", "SUPERVISOR", "ADMIN"))],
):
    """Fetch a single time-off request. Workers can only see their own."""
    req = await timeoff_service.get_request(request_id)
    if current_user.role == "WORKER" and req.workerId != current_user.profile_id:
        raise HTTPException(status_code=403, detail="Access denied")
    return req
