from typing import Annotated

from fastapi import APIRouter, Depends

from app.auth.authorization import ensure_supervisor_owns_worker
from app.auth.dependencies import require_role
from app.db import get_db
from app.schemas.auth import CurrentUser
from app.schemas.shiftswap import ShiftSwapCreate, ShiftSwapReview
from app.services import shiftswap_service

router = APIRouter(prefix="/shiftswap", tags=["ShiftSwap"])
_db = get_db()


@router.post("", status_code=201)
async def submit_swap(
    body: ShiftSwapCreate,
    current_user: Annotated[CurrentUser, Depends(require_role("WORKER"))],
):
    """Worker submits a shift swap request targeting another worker."""
    return await shiftswap_service.submit_swap_request(body, worker_id=current_user.profile_id)


@router.post("/{request_id}/cancel")
async def cancel_swap(
    request_id: str,
    current_user: Annotated[CurrentUser, Depends(require_role("WORKER"))],
):
    """Worker cancels their own pending swap request."""
    return await shiftswap_service.cancel_swap_request(
        request_id, worker_id=current_user.profile_id
    )


@router.get("/my")
async def my_swaps(
    current_user: Annotated[CurrentUser, Depends(require_role("WORKER"))],
):
    """Worker views swap requests they initiated or received."""
    return await shiftswap_service.list_swap_requests_for_worker(
        worker_id=current_user.profile_id
    )


@router.get("/pending")
async def pending_swaps(
    current_user: Annotated[CurrentUser, Depends(require_role("SUPERVISOR", "ADMIN"))],
):
    """
    Admin sees all pending swap requests.
    Supervisor sees only swap requests involving workers in their department.
    """
    all_pending = await shiftswap_service.list_pending_swaps()
    if current_user.role == "ADMIN":
        return all_pending

    supervisor = await _db.supervisor.find_unique(where={"id": current_user.profile_id})
    dept_worker_ids = {
        w.id
        for w in await _db.worker.find_many(where={"departmentId": supervisor.departmentId})
    }
    return [
        r
        for r in all_pending
        if r.initiatedById in dept_worker_ids or r.targetWorkerId in dept_worker_ids
    ]


@router.post("/{request_id}/review")
async def review_swap(
    request_id: str,
    body: ShiftSwapReview,
    current_user: Annotated[CurrentUser, Depends(require_role("SUPERVISOR", "ADMIN"))],
):
    """Supervisor or Admin approves/rejects a pending swap request."""
    if current_user.role == "SUPERVISOR":
        req = await _db.shiftswaprequest.find_unique(where={"id": request_id})
        if req:
            await ensure_supervisor_owns_worker(current_user.profile_id, req.initiatedById)
    return await shiftswap_service.review_swap_request(
        request_id, body, supervisor_id=current_user.profile_id
    )
