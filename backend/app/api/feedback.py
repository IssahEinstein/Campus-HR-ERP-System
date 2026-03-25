from typing import Annotated

from fastapi import APIRouter, Depends

from app.auth.dependencies import require_role
from app.schemas.auth import CurrentUser
from app.schemas.feedback import FeedbackCreateRequest, FeedbackResponse
from app.services import feedback_service

router = APIRouter(prefix="/feedback", tags=["Feedback"])


@router.post("/workers/{worker_id}", response_model=FeedbackResponse, status_code=201)
async def create_feedback(
    worker_id: str,
    body: FeedbackCreateRequest,
    current_user: Annotated[CurrentUser, Depends(require_role("SUPERVISOR"))],
):
    """Supervisor creates feedback for a worker in their department."""
    return await feedback_service.create_feedback_for_worker(
        worker_id=worker_id,
        supervisor_id=current_user.profile_id,
        body=body,
    )


@router.get("/my", response_model=list[FeedbackResponse])
async def list_my_feedback(
    current_user: Annotated[CurrentUser, Depends(require_role("WORKER"))],
):
    """Worker lists all feedback given by supervisors."""
    return await feedback_service.list_feedback_for_worker(current_user.profile_id)
