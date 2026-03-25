from fastapi import HTTPException

from app.db import get_db
from app.schemas.shiftswap import ShiftSwapCreate, ShiftSwapReview


db = get_db()


async def submit_swap_request(data: ShiftSwapCreate, worker_id: str):
    """Worker submits a shift swap request targeting another worker."""
    # Verify the initiating worker exists
    worker = await db.worker.find_unique(where={"id": worker_id})
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    # Verify the from-assignment belongs to this worker
    from_assignment = await db.shiftassignment.find_unique(where={"id": data.from_assignment_id})
    if not from_assignment:
        raise HTTPException(status_code=404, detail="From-assignment not found")
    if from_assignment.workerId != worker_id:
        raise HTTPException(status_code=403, detail="from_assignment does not belong to you")

    # Verify target worker exists
    target = await db.worker.find_unique(where={"id": data.target_worker_id})
    if not target:
        raise HTTPException(status_code=404, detail="Target worker not found")

    # No self-swaps
    if data.target_worker_id == worker_id:
        raise HTTPException(status_code=400, detail="Cannot swap with yourself")

    # Check for duplicate pending request
    existing = await db.shiftswaprequest.find_first(
        where={
            "initiatedById": worker_id,
            "fromAssignmentId": data.from_assignment_id,
            "status": "PENDING",
        }
    )
    if existing:
        raise HTTPException(status_code=409, detail="A pending swap request already exists for this assignment")

    return await db.shiftswaprequest.create(
        data={
            "initiatedById": worker_id,
            "targetWorkerId": data.target_worker_id,
            "fromAssignmentId": data.from_assignment_id,
            "toAssignmentId": data.to_assignment_id,
            "reason": data.reason,
        }
    )


async def cancel_swap_request(request_id: str, worker_id: str):
    """Initiating worker cancels their own pending swap request."""
    req = await db.shiftswaprequest.find_unique(where={"id": request_id})
    if not req:
        raise HTTPException(status_code=404, detail="Swap request not found")
    if req.initiatedById != worker_id:
        raise HTTPException(status_code=403, detail="This request does not belong to you")
    if req.status != "PENDING":
        raise HTTPException(status_code=409, detail="Only PENDING requests can be cancelled")

    return await db.shiftswaprequest.update(
        where={"id": request_id},
        data={"status": "CANCELLED"},
    )


async def review_swap_request(request_id: str, data: ShiftSwapReview, supervisor_id: str):
    """Supervisor approves or rejects a swap request."""
    if data.status not in ("APPROVED", "REJECTED"):
        raise HTTPException(status_code=422, detail="status must be APPROVED or REJECTED")

    req = await db.shiftswaprequest.find_unique(where={"id": request_id})
    if not req:
        raise HTTPException(status_code=404, detail="Swap request not found")
    if req.status != "PENDING":
        raise HTTPException(status_code=409, detail="Only PENDING requests can be reviewed")

    return await db.shiftswaprequest.update(
        where={"id": request_id},
        data={
            "status": data.status,
            "reviewedById": supervisor_id,
            "approvalNotes": data.approval_notes,
        },
    )


async def get_swap_request(request_id: str):
    """Fetch a single swap request."""
    req = await db.shiftswaprequest.find_unique(where={"id": request_id})
    if not req:
        raise HTTPException(status_code=404, detail="Swap request not found")
    return req


async def list_swap_requests_for_worker(worker_id: str):
    """List all swap requests where the worker is initiator or target."""
    return await db.shiftswaprequest.find_many(
        where={
            "OR": [
                {"initiatedById": worker_id},
                {"targetWorkerId": worker_id},
            ]
        },
        order={"createdAt": "desc"},
    )


async def list_pending_swaps():
    """Supervisor view — all pending swap requests."""
    return await db.shiftswaprequest.find_many(
        where={"status": "PENDING"},
        order={"createdAt": "asc"},
    )
