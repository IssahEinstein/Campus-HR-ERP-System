from typing import Annotated

from fastapi import APIRouter, Depends

from app.auth.dependencies import require_role
from app.db import get_db
from app.schemas.auth import CurrentUser
from app.schemas.invite import InviteWorkerRequest
from app.services import invite_service

router = APIRouter(prefix="/supervisor", tags=["Supervisor"])
_db = get_db()


@router.post("/invite-worker", status_code=201)
async def invite_worker(
    body: InviteWorkerRequest,
    current_user: Annotated[CurrentUser, Depends(require_role("SUPERVISOR"))],
):
    """Supervisor invites a new worker — an email with a setup link is sent."""
    return await invite_service.invite_worker(body, supervisor_id=current_user.profile_id)


@router.get("/workers")
async def list_my_workers(
    current_user: Annotated[CurrentUser, Depends(require_role("SUPERVISOR"))],
):
    """List all workers in this supervisor's department."""
    supervisor = await _db.supervisor.find_unique(where={"id": current_user.profile_id})
    return await _db.worker.find_many(
        where={"departmentId": supervisor.departmentId},
        include={"user": True},
        order={"createdAt": "desc"},
    )


@router.get("/profile")
async def get_my_profile(
    current_user: Annotated[CurrentUser, Depends(require_role("SUPERVISOR"))],
):
    """Supervisor views their own profile."""
    return await _db.supervisor.find_unique(
        where={"id": current_user.profile_id},
        include={"user": True, "department": True},
    )
