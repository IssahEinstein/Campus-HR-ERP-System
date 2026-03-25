from app.auth.authorization import ensure_supervisor_owns_worker
from app.db import get_db
from app.schemas.feedback import FeedbackCreateRequest

_db = get_db()


async def create_feedback_for_worker(
    worker_id: str,
    supervisor_id: str,
    body: FeedbackCreateRequest,
):
    await ensure_supervisor_owns_worker(supervisor_id, worker_id)

    return await _db.feedback.create(
        data={
            "workerId": worker_id,
            "supervisorId": supervisor_id,
            "rating": body.rating,
            "comments": body.comments,
            "category": body.category,
        },
        include={"supervisor": {"include": {"user": True}}},
    )


async def list_feedback_for_worker(worker_id: str):
    return await _db.feedback.find_many(
        where={"workerId": worker_id},
        include={"supervisor": {"include": {"user": True}}},
        order={"createdAt": "desc"},
    )
