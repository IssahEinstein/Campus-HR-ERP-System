from fastapi import HTTPException

from app.db import get_db
from app.schemas.timeoff import TimeOffCreate, TimeOffReview


db = get_db()


async def submit_request(data: TimeOffCreate, worker_id: str):
    """Worker submits a time-off request."""
    worker = await db.worker.find_unique(where={"id": worker_id})
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    # Block duplicate pending request for overlapping dates
    overlap = await db.timeoffrequest.find_first(
        where={
            "workerId": worker_id,
            "status": "PENDING",
            "startDate": {"lte": data.end_date},
            "endDate": {"gte": data.start_date},
        }
    )
    if overlap:
        raise HTTPException(
            status_code=409,
            detail="You already have a pending time-off request overlapping these dates"
        )

    request = await db.timeoffrequest.create(
        data={
            "workerId": worker_id,
            "startDate": data.start_date,
            "endDate": data.end_date,
            "reason": data.reason,
        }
    )
    return request


async def cancel_request(request_id: str, worker_id: str):
    """Worker cancels their own PENDING request."""
    request = await db.timeoffrequest.find_unique(where={"id": request_id})
    if not request:
        raise HTTPException(status_code=404, detail="Time-off request not found")
    if request.workerId != worker_id:
        raise HTTPException(status_code=403, detail="This request does not belong to you")
    if request.status != "PENDING":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel a request that is already {request.status}"
        )

    return await db.timeoffrequest.update(
        where={"id": request_id},
        data={"status": "CANCELLED"},
    )


async def review_request(request_id: str, data: TimeOffReview, supervisor_id: str):
    """Supervisor approves or rejects a time-off request."""
    if data.status not in ("APPROVED", "REJECTED"):
        raise HTTPException(status_code=400, detail="Status must be APPROVED or REJECTED")

    request = await db.timeoffrequest.find_unique(where={"id": request_id})
    if not request:
        raise HTTPException(status_code=404, detail="Time-off request not found")
    if request.status != "PENDING":
        raise HTTPException(
            status_code=400,
            detail=f"Request is already {request.status} and cannot be reviewed again"
        )

    return await db.timeoffrequest.update(
        where={"id": request_id},
        data={
            "status": data.status,
            "reviewedById": supervisor_id,
            "approvalNotes": data.approval_notes,
        },
    )


async def get_request(request_id: str):
    """Fetch a single time-off request."""
    request = await db.timeoffrequest.find_unique(where={"id": request_id})
    if not request:
        raise HTTPException(status_code=404, detail="Time-off request not found")
    return request


async def list_requests_for_worker(worker_id: str):
    """List all time-off requests submitted by a specific worker."""
    return await db.timeoffrequest.find_many(
        where={"workerId": worker_id},
        order={"createdAt": "desc"},
    )


async def list_pending_requests():
    """Supervisor views all pending time-off requests."""
    return await db.timeoffrequest.find_many(
        where={"status": "PENDING"},
        order={"createdAt": "asc"},
    )
