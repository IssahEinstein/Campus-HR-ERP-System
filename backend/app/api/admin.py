from typing import Annotated

from fastapi import APIRouter, Depends

from app.auth.dependencies import require_role
from app.db import get_db
from app.schemas.auth import CurrentUser
from app.schemas.invite import DepartmentCreate, InviteSupervisorRequest
from app.services import department_service, invite_service

router = APIRouter(prefix="/admin", tags=["Admin"])
_db = get_db()


@router.post("/invite-supervisor", status_code=201)
async def invite_supervisor(
    body: InviteSupervisorRequest,
    current_user: Annotated[CurrentUser, Depends(require_role("ADMIN"))],
):
    """Admin invites a new supervisor — an email with a setup link is sent."""
    return await invite_service.invite_supervisor(body, admin_id=current_user.profile_id)


@router.get("/supervisors")
async def list_supervisors(
    current_user: Annotated[CurrentUser, Depends(require_role("ADMIN"))],
):
    """Admin views all supervisors across the system."""
    return await _db.supervisor.find_many(
        include={"user": True, "department": True},
        order={"createdAt": "desc"},
    )


@router.get("/workers")
async def list_all_workers(
    current_user: Annotated[CurrentUser, Depends(require_role("ADMIN"))],
):
    """Admin views all workers across the system."""
    return await _db.worker.find_many(
        include={"user": True, "department": True},
        order={"createdAt": "desc"},
    )


@router.post("/departments", status_code=201)
async def create_department(
    body: DepartmentCreate,
    current_user: Annotated[CurrentUser, Depends(require_role("ADMIN"))],
):
    """Admin creates a new department."""
    return await department_service.create_department(body.name, admin_id=current_user.profile_id)


@router.get("/departments")
async def list_departments(
    current_user: Annotated[CurrentUser, Depends(require_role("ADMIN"))],
):
    """Admin lists all departments."""
    return await department_service.list_departments()
