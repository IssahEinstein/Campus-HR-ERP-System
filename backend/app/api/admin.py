from typing import Annotated

from fastapi import APIRouter, Depends, Header

from app.auth.dependencies import require_role
from app.db import get_db
from app.schemas.auth import CurrentUser
from app.schemas.common import BootstrapResponse, MessageResponse
from app.schemas.invite import (
    BootstrapAdminRequest,
    DepartmentCreate,
    InviteAdminRequest,
    InviteSupervisorRequest,
)
from app.schemas.profiles import AdminResponse, DepartmentResponse, SupervisorResponse, WorkerResponse
from app.services import admin_service, department_service, invite_service

router = APIRouter(prefix="/admin", tags=["Admin"])
_db = get_db()


@router.post("/bootstrap", status_code=201, response_model=BootstrapResponse)
async def bootstrap_admin(
    body: BootstrapAdminRequest,
    x_admin_bootstrap_key: str | None = Header(default=None),
):
    """
    One-time endpoint to create the first ADMIN account.
    Disabled automatically after an admin already exists.
    """
    return await admin_service.bootstrap_admin(body, provided_key=x_admin_bootstrap_key)


@router.post("/invite-supervisor", status_code=201, response_model=MessageResponse)
async def invite_supervisor(
    body: InviteSupervisorRequest,
    current_user: Annotated[CurrentUser, Depends(require_role("ADMIN"))],
):
    """Admin invites a new supervisor — an email with a setup link is sent."""
    return await invite_service.invite_supervisor(body, admin_id=current_user.profile_id)


@router.post("/invite-admin", status_code=201, response_model=MessageResponse)
async def invite_admin(
    body: InviteAdminRequest,
    current_user: Annotated[CurrentUser, Depends(require_role("ADMIN"))],
):
    """Admin invites another admin (peer-level) with an activation email."""
    return await invite_service.invite_admin(body, inviter_admin_id=current_user.profile_id)


@router.post("/admins/{admin_profile_id}/resend-invite", response_model=MessageResponse)
async def resend_admin_invite(
    admin_profile_id: str,
    current_user: Annotated[CurrentUser, Depends(require_role("ADMIN"))],
):
    """Inviting admin can resend invite email to a not-yet-activated admin."""
    return await invite_service.resend_admin_invite(
        admin_profile_id=admin_profile_id,
        requester_admin_id=current_user.profile_id,
    )


@router.post("/supervisors/{supervisor_id}/resend-invite", response_model=MessageResponse)
async def resend_supervisor_invite(
    supervisor_id: str,
    current_user: Annotated[CurrentUser, Depends(require_role("ADMIN"))],
):
    """Admin resends invite email to a not-yet-activated supervisor."""
    return await invite_service.resend_supervisor_invite(
        supervisor_id=supervisor_id,
        admin_id=current_user.profile_id,
    )


@router.get("/supervisors", response_model=list[SupervisorResponse])
async def list_supervisors(
    current_user: Annotated[CurrentUser, Depends(require_role("ADMIN"))],
):
    """Admin views all supervisors across the system."""
    supervisors = await _db.supervisor.find_many(
        include={"user": {"include": {"supervisorInvite": True}}, "department": True},
        order={"createdAt": "desc"},
    )

    return [
        {
            "id": supervisor.id,
            "supervisor_id": supervisor.supervisorId,
            "user_id": supervisor.userId,
            "department_id": supervisor.departmentId,
            "created_at": supervisor.createdAt,
            "invite_pending": bool(
                supervisor.user
                and supervisor.user.supervisorInvite
                and supervisor.user.supervisorInvite.usedAt is None
            ),
            "user": supervisor.user,
            "department": supervisor.department,
        }
        for supervisor in supervisors
    ]


@router.get("/admins", response_model=list[AdminResponse])
async def list_admins(
    current_user: Annotated[CurrentUser, Depends(require_role("ADMIN"))],
):
    """Admin views all admins across the system."""
    admins = await _db.admin.find_many(
        include={"user": {"include": {"adminInvite": True}}},
        order={"createdAt": "desc"},
    )

    return [
        {
            "id": admin.id,
            "admin_id": admin.adminId,
            "user_id": admin.userId,
            "created_at": admin.createdAt,
            "invite_pending": bool(
                admin.user
                and admin.user.adminInvite
                and admin.user.adminInvite.usedAt is None
            ),
            "user": admin.user,
        }
        for admin in admins
    ]


@router.get("/workers", response_model=list[WorkerResponse])
async def list_all_workers(
    current_user: Annotated[CurrentUser, Depends(require_role("ADMIN"))],
):
    """Admin views all workers across the system."""
    return await _db.worker.find_many(
        include={"user": True, "department": True},
        order={"createdAt": "desc"},
    )


@router.post("/departments", status_code=201, response_model=DepartmentResponse)
async def create_department(
    body: DepartmentCreate,
    current_user: Annotated[CurrentUser, Depends(require_role("ADMIN"))],
):
    """Admin creates a new department."""
    return await department_service.create_department(body.name, admin_id=current_user.profile_id)


@router.get("/departments", response_model=list[DepartmentResponse])
async def list_departments(
    current_user: Annotated[CurrentUser, Depends(require_role("ADMIN"))],
):
    """Admin lists all departments."""
    return await department_service.list_departments()


@router.delete("/supervisors/{supervisor_id}", response_model=MessageResponse)
async def delete_supervisor(
    supervisor_id: str,
    current_user: Annotated[CurrentUser, Depends(require_role("ADMIN"))],
):
    """Admin deletes a supervisor account."""
    return await admin_service.delete_supervisor(supervisor_id)
