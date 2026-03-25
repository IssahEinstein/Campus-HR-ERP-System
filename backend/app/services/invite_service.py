from datetime import datetime, timezone

from fastapi import HTTPException

from app.auth.password import hash_password
from app.core.config import settings
from app.db import get_db
from app.repositories import invites as invite_repo
from app.schemas.invite import InviteSupervisorRequest, InviteWorkerRequest
from app.utils.email import send_invite_email

db = get_db()

_PLACEHOLDER = "INVITE_PENDING"


def _aware(dt: datetime) -> datetime:
    """Ensure a datetime is timezone-aware (UTC)."""
    return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt


async def invite_supervisor(data: InviteSupervisorRequest, admin_id: str) -> dict:
    """Admin creates a supervisor account and sends an invite email."""
    if await db.user.find_unique(where={"email": data.email}):
        raise HTTPException(status_code=409, detail="Email already registered")

    if await db.supervisor.find_first(where={"supervisorId": data.supervisor_id}):
        raise HTTPException(status_code=409, detail="Supervisor ID already in use")

    dept = await db.department.find_unique(where={"id": data.department_id})
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    user = await db.user.create(data={
        "email": data.email,
        "firstName": data.first_name,
        "lastName": data.last_name,
        "role": "SUPERVISOR",
        "passwordHash": _PLACEHOLDER,
    })

    await db.supervisor.create(data={
        "userId": user.id,
        "supervisorId": data.supervisor_id,
        "departmentId": data.department_id,
        "createdByAdminId": admin_id,
    })

    token = await invite_repo.create_supervisor_invite(user.id)
    invite_link = f"{settings.FRONTEND_URL}/accept-invite?token={token}&type=supervisor"

    await send_invite_email(
        to=data.email,
        name=f"{data.first_name} {data.last_name}",
        role="Supervisor",
        invite_link=invite_link,
    )

    return {"message": "Supervisor invited successfully", "email": data.email}


async def invite_worker(data: InviteWorkerRequest, supervisor_id: str) -> dict:
    """Supervisor creates a worker account and sends an invite email."""
    supervisor = await db.supervisor.find_unique(where={"id": supervisor_id})
    if not supervisor:
        raise HTTPException(status_code=404, detail="Supervisor profile not found")

    if await db.user.find_unique(where={"email": data.email}):
        raise HTTPException(status_code=409, detail="Email already registered")

    if await db.worker.find_first(where={"workerId": data.worker_id}):
        raise HTTPException(status_code=409, detail="Worker ID already in use")

    if await db.worker.find_first(where={"studentId": data.student_id}):
        raise HTTPException(status_code=409, detail="Student ID already registered")

    user = await db.user.create(data={
        "email": data.email,
        "firstName": data.first_name,
        "lastName": data.last_name,
        "role": "WORKER",
        "passwordHash": _PLACEHOLDER,
    })

    worker = await db.worker.create(data={
        "userId": user.id,
        "workerId": data.worker_id,
        "studentId": data.student_id,
        "departmentId": supervisor.departmentId,
        "status": "INVITED",
    })

    token = await invite_repo.create_worker_invite(worker.id)
    invite_link = f"{settings.FRONTEND_URL}/accept-invite?token={token}&type=worker"

    await send_invite_email(
        to=data.email,
        name=f"{data.first_name} {data.last_name}",
        role="Worker",
        invite_link=invite_link,
    )

    return {"message": "Worker invited successfully", "email": data.email}


async def accept_supervisor_invite(token: str, password: str) -> dict:
    """Supervisor accepts invite and sets their password."""
    invite = await invite_repo.get_supervisor_invite_by_token(token)

    if not invite:
        raise HTTPException(status_code=400, detail="Invalid or expired invite token")
    if invite.usedAt is not None:
        raise HTTPException(status_code=400, detail="Invite token has already been used")
    if _aware(invite.expiresAt) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invite token has expired")

    await db.user.update(
        where={"id": invite.userId},
        data={"passwordHash": hash_password(password)},
    )
    await invite_repo.mark_supervisor_invite_used(invite.id)
    return {"message": "Password set successfully. You can now log in."}


async def accept_worker_invite(token: str, password: str) -> dict:
    """Worker accepts invite, sets password, status becomes ACTIVE."""
    invite = await invite_repo.get_worker_invite_by_token(token)

    if not invite:
        raise HTTPException(status_code=400, detail="Invalid or expired invite token")
    if invite.usedAt is not None:
        raise HTTPException(status_code=400, detail="Invite token has already been used")
    if _aware(invite.expiresAt) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invite token has expired")

    await db.user.update(
        where={"id": invite.worker.user.id},
        data={"passwordHash": hash_password(password)},
    )
    await db.worker.update(
        where={"id": invite.worker.id},
        data={"status": "ACTIVE"},
    )
    await invite_repo.mark_worker_invite_used(invite.id)
    return {"message": "Account activated. You can now log in."}
