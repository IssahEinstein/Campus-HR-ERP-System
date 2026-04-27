from datetime import datetime, timezone
import asyncio
import logging

from fastapi import HTTPException

from app.auth.password import hash_password
from app.core.config import settings
from app.db import get_db
from app.repositories import invites as invite_repo
from app.schemas.invite import InviteAdminRequest, InviteSupervisorRequest, InviteWorkerRequest
from app.utils.email import EmailDeliveryError, send_invite_email

db = get_db()
logger = logging.getLogger("task_app.invites")

_PLACEHOLDER = "INVITE_PENDING"
_ALLOWED_ENROLLMENT_STATUSES = {"FULL_TIME", "PART_TIME", "ON_LEAVE", "GRADUATED"}


def _aware(dt: datetime) -> datetime:
    """Ensure a datetime is timezone-aware (UTC)."""
    return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt


async def _send_invite_email_background(*, to: str, name: str, role: str, invite_link: str) -> None:
    """Attempt email delivery in background so invite creation is not blocked by SMTP latency."""
    try:
        await send_invite_email(to=to, name=name, role=role, invite_link=invite_link)
        logger.info("Invite email queued delivery accepted for to=%s role=%s", to, role)
    except EmailDeliveryError as exc:
        logger.warning(
            "%s invite email failed for to=%s smtp_code=%s transient=%s reason=%s",
            role,
            exc.recipient,
            exc.smtp_code,
            exc.transient,
            exc.reason,
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to send %s invite email", role, exc_info=exc)


def _queue_invite_email(*, to: str, name: str, role: str, invite_link: str) -> None:
    asyncio.create_task(
        _send_invite_email_background(
            to=to,
            name=name,
            role=role,
            invite_link=invite_link,
        )
    )


async def invite_supervisor(data: InviteSupervisorRequest, admin_id: str) -> dict:
    """Admin creates a supervisor account and sends an invite email."""
    recipient_email = str(data.email).strip().lower()

    if await db.user.find_unique(where={"email": recipient_email}):
        raise HTTPException(status_code=409, detail="Email already registered")

    if await db.supervisor.find_first(where={"supervisorId": data.supervisor_id}):
        raise HTTPException(status_code=409, detail="Supervisor ID already in use")

    dept = await db.department.find_unique(where={"id": data.department_id})
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    user = await db.user.create(data={
        "email": recipient_email,
        "firstName": data.first_name,
        "lastName": data.last_name,
        "role": "SUPERVISOR",
        "passwordHash": hash_password(data.supervisor_id),
    })

    await db.supervisor.create(data={
        "userId": user.id,
        "supervisorId": data.supervisor_id,
        "departmentId": data.department_id,
        "createdByAdminId": admin_id,
    })

    token = await invite_repo.create_supervisor_invite(user.id)
    invite_link = f"{settings.FRONTEND_URL}/accept-invite?token={token}&type=supervisor"

    _queue_invite_email(
        to=recipient_email,
        name=f"{data.first_name} {data.last_name}",
        role="Supervisor",
        invite_link=invite_link,
    )
    return {
        "message": "Supervisor invited successfully. Email delivery is processing in the background.",
        "email": recipient_email,
    }


async def invite_admin(data: InviteAdminRequest, inviter_admin_id: str) -> dict:
    """Admin creates another admin account and sends an invite email."""
    inviter = await db.admin.find_unique(
        where={"id": inviter_admin_id},
        include={"user": {"include": {"adminInvite": True}}},
    )
    # Only bootstrapped (system) admins can invite new admins.
    # A bootstrapped admin has no AdminInvite record.
    if not inviter or (inviter.user and inviter.user.adminInvite):
        raise HTTPException(
            status_code=403,
            detail="Only system admins can invite new admins",
        )

    recipient_email = str(data.email).strip().lower()

    if await db.user.find_unique(where={"email": recipient_email}):
        raise HTTPException(status_code=409, detail="Email already registered")

    if await db.admin.find_first(where={"adminId": data.admin_id}):
        raise HTTPException(status_code=409, detail="Admin ID already in use")

    user = await db.user.create(data={
        "email": recipient_email,
        "firstName": data.first_name,
        "lastName": data.last_name,
        "role": "ADMIN",
        "passwordHash": _PLACEHOLDER,
    })

    await db.admin.create(data={
        "userId": user.id,
        "adminId": data.admin_id,
    })

    token = await invite_repo.create_admin_invite(
        user.id,
        invited_by_admin_id=inviter_admin_id,
    )
    invite_link = f"{settings.FRONTEND_URL}/accept-invite?token={token}&type=admin"

    _queue_invite_email(
        to=recipient_email,
        name=f"{data.first_name} {data.last_name}",
        role="Admin",
        invite_link=invite_link,
    )
    return {
        "message": "Admin invited successfully. Email delivery is processing in the background.",
        "email": recipient_email,
    }


async def resend_supervisor_invite(supervisor_id: str, admin_id: str) -> dict:
    """Admin resends supervisor invite email for accounts not yet activated."""
    supervisor = await db.supervisor.find_unique(
        where={"id": supervisor_id},
        include={"user": {"include": {"supervisorInvite": True}}},
    )
    if not supervisor:
        raise HTTPException(status_code=404, detail="Supervisor not found")

    if supervisor.user.supervisorInvite is None or supervisor.user.supervisorInvite.usedAt is not None:
        raise HTTPException(status_code=409, detail="Supervisor account is already activated")

    token = await invite_repo.create_supervisor_invite(supervisor.userId)
    invite_link = f"{settings.FRONTEND_URL}/accept-invite?token={token}&type=supervisor"
    recipient_email = supervisor.user.email
    full_name = f"{supervisor.user.firstName} {supervisor.user.lastName}".strip()

    _queue_invite_email(
        to=recipient_email,
        name=full_name,
        role="Supervisor",
        invite_link=invite_link,
    )
    return {
        "message": "Supervisor invite resent successfully. Email delivery is processing in the background.",
        "email": recipient_email,
    }


async def resend_admin_invite(admin_profile_id: str, requester_admin_id: str) -> dict:
    """Only the inviter admin can resend invite for not-yet-activated admins."""
    requester = await db.admin.find_unique(where={"id": requester_admin_id})
    if not requester:
        raise HTTPException(status_code=404, detail="Admin profile not found")

    invited_admin = await db.admin.find_unique(
        where={"id": admin_profile_id},
        include={"user": {"include": {"adminInvite": True}}},
    )
    if not invited_admin:
        raise HTTPException(status_code=404, detail="Admin not found")

    if invited_admin.user.adminInvite is None or invited_admin.user.adminInvite.usedAt is not None:
        raise HTTPException(status_code=409, detail="Admin account is already activated")

    inviter_id = invited_admin.user.adminInvite.invitedByAdminId
    if inviter_id and inviter_id != requester_admin_id:
        raise HTTPException(status_code=403, detail="Only the inviting admin can resend this invite")

    token = await invite_repo.create_admin_invite(
        invited_admin.userId,
        invited_by_admin_id=requester_admin_id,
    )
    invite_link = f"{settings.FRONTEND_URL}/accept-invite?token={token}&type=admin"
    recipient_email = invited_admin.user.email
    full_name = f"{invited_admin.user.firstName} {invited_admin.user.lastName}".strip()

    _queue_invite_email(
        to=recipient_email,
        name=full_name,
        role="Admin",
        invite_link=invite_link,
    )
    return {
        "message": "Admin invite resent successfully. Email delivery is processing in the background.",
        "email": recipient_email,
    }


async def invite_worker(data: InviteWorkerRequest, supervisor_id: str) -> dict:
    """Supervisor creates a worker account and sends an invite email."""
    supervisor = await db.supervisor.find_unique(where={"id": supervisor_id})
    if not supervisor:
        raise HTTPException(status_code=404, detail="Supervisor profile not found")

    recipient_email = str(data.email).strip().lower()

    if await db.user.find_unique(where={"email": recipient_email}):
        raise HTTPException(status_code=409, detail="Email already registered")

    if await db.worker.find_first(where={"workerId": data.worker_id}):
        raise HTTPException(status_code=409, detail="Worker ID already in use")

    if await db.worker.find_first(where={"studentId": data.student_id}):
        raise HTTPException(status_code=409, detail="Student ID already registered")

    requested_role = str(data.role or "WORKER").upper()
    if requested_role != "WORKER":
        raise HTTPException(status_code=403, detail="Supervisors can only create WORKER accounts")

    enrollment_status = None
    if data.enrollment_status is not None:
        enrollment_status = str(data.enrollment_status).strip().upper()
        if enrollment_status not in _ALLOWED_ENROLLMENT_STATUSES:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Invalid enrollment_status. "
                    "Use one of: FULL_TIME, PART_TIME, ON_LEAVE, GRADUATED"
                ),
            )

    user = await db.user.create(data={
        "email": recipient_email,
        "firstName": data.first_name,
        "lastName": data.last_name,
        "role": requested_role,
        "passwordHash": hash_password(data.worker_id),
    })

    worker = await db.worker.create(data={
        "userId": user.id,
        "workerId": data.worker_id,
        "studentId": data.student_id,
        "departmentId": supervisor.departmentId,
        "status": "INVITED",
        "gpa": data.gpa,
        "enrollmentStatus": enrollment_status,
        "courseLoadCredits": data.course_load_credits,
    })

    token = await invite_repo.create_worker_invite(worker.id)
    invite_link = f"{settings.FRONTEND_URL}/accept-invite?token={token}&type=worker"

    _queue_invite_email(
        to=recipient_email,
        name=f"{data.first_name} {data.last_name}",
        role="Worker",
        invite_link=invite_link,
    )
    return {
        "message": "Worker invited successfully. Email delivery is processing in the background.",
        "email": recipient_email,
    }


async def resend_worker_invite(worker_id: str, supervisor_id: str) -> dict:
    """Supervisor resends invite email to an invited worker in their department."""
    supervisor = await db.supervisor.find_unique(where={"id": supervisor_id})
    if not supervisor:
        raise HTTPException(status_code=404, detail="Supervisor profile not found")

    worker = await db.worker.find_unique(
        where={"id": worker_id},
        include={"user": True},
    )
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    if worker.departmentId != supervisor.departmentId:
        raise HTTPException(status_code=403, detail="You are not allowed to manage this worker")

    if str(worker.status) != "INVITED":
        raise HTTPException(status_code=409, detail="Worker account is already activated")

    token = await invite_repo.create_worker_invite(worker.id)
    invite_link = f"{settings.FRONTEND_URL}/accept-invite?token={token}&type=worker"
    recipient_email = worker.user.email
    full_name = f"{worker.user.firstName} {worker.user.lastName}".strip()

    _queue_invite_email(
        to=recipient_email,
        name=full_name,
        role="Worker",
        invite_link=invite_link,
    )
    return {
        "message": "Worker invite resent successfully. Email delivery is processing in the background.",
        "email": recipient_email,
    }


async def delete_worker(worker_id: str, supervisor_id: str) -> dict:
    """Supervisor deletes a worker in their department."""
    supervisor = await db.supervisor.find_unique(where={"id": supervisor_id})
    if not supervisor:
        raise HTTPException(status_code=404, detail="Supervisor profile not found")

    worker = await db.worker.find_unique(
        where={"id": worker_id},
        include={"user": True},
    )
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    if worker.departmentId != supervisor.departmentId:
        raise HTTPException(status_code=403, detail="You are not allowed to manage this worker")

    await db.user.delete(where={"id": worker.userId})
    return {
        "message": "Worker deleted successfully",
        "email": worker.user.email,
    }


async def accept_supervisor_invite(token: str, password: str) -> dict:
    """Supervisor accepts invite and sets their password."""
    invite = await invite_repo.get_supervisor_invite_by_token(token)

    if not invite:
        raise HTTPException(status_code=400, detail="Invalid or expired invite token")
    if invite.usedAt is not None:
        return {"message": "Account already activated. You can now log in."}
    if _aware(invite.expiresAt) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invite token has expired")

    await db.user.update(
        where={"id": invite.userId},
        data={"passwordHash": hash_password(password)},
    )
    try:
        await invite_repo.mark_supervisor_invite_used(invite.id)
    except Exception as exc:  # noqa: BLE001
        logger.exception(
            "Supervisor password set but failed to mark invite used (invite_id=%s)",
            invite.id,
            exc_info=exc,
        )
    return {"message": "Password set successfully. You can now log in."}


async def accept_admin_invite(token: str, password: str) -> dict:
    """Admin accepts invite and sets their password."""
    invite = await invite_repo.get_admin_invite_by_token(token)

    if not invite:
        raise HTTPException(status_code=400, detail="Invalid or expired invite token")
    if invite.usedAt is not None:
        return {"message": "Account already activated. You can now log in."}
    if _aware(invite.expiresAt) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invite token has expired")

    await db.user.update(
        where={"id": invite.userId},
        data={"passwordHash": hash_password(password)},
    )
    try:
        await invite_repo.mark_admin_invite_used(invite.id)
    except Exception as exc:  # noqa: BLE001
        logger.exception(
            "Admin password set but failed to mark invite used (invite_id=%s)",
            invite.id,
            exc_info=exc,
        )
    return {"message": "Password set successfully. You can now log in."}


async def accept_worker_invite(token: str, password: str) -> dict:
    """Worker accepts invite, sets password, status becomes ACTIVE."""
    invite = await invite_repo.get_worker_invite_by_token(token)

    if not invite:
        raise HTTPException(status_code=400, detail="Invalid or expired invite token")
    if invite.usedAt is not None:
        return {"message": "Account already activated. You can now log in."}
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
    try:
        await invite_repo.mark_worker_invite_used(invite.id)
    except Exception as exc:  # noqa: BLE001
        logger.exception(
            "Worker password set but failed to mark invite used (invite_id=%s)",
            invite.id,
            exc_info=exc,
        )
    return {"message": "Account activated. You can now log in."}
