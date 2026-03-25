from datetime import datetime, timezone
import logging

from fastapi import HTTPException

from app.auth.password import hash_password
from app.core.config import settings
from app.db import get_db
from app.repositories import invites as invite_repo
from app.schemas.invite import InviteSupervisorRequest, InviteWorkerRequest
from app.utils.email import EmailDeliveryError, send_invite_email

db = get_db()
logger = logging.getLogger("task_app.invites")

_PLACEHOLDER = "INVITE_PENDING"


def _aware(dt: datetime) -> datetime:
    """Ensure a datetime is timezone-aware (UTC)."""
    return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt


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

    try:
        await send_invite_email(
            to=recipient_email,
            name=f"{data.first_name} {data.last_name}",
            role="Supervisor",
            invite_link=invite_link,
        )
        return {"message": "Supervisor invited successfully", "email": recipient_email}
    except EmailDeliveryError as exc:
        logger.warning(
            "Supervisor invite email failed for to=%s smtp_code=%s transient=%s reason=%s",
            exc.recipient,
            exc.smtp_code,
            exc.transient,
            exc.reason,
        )
        return {
            "message": (
                "Supervisor account created, but invite email was rejected for "
                f"{exc.recipient}: {exc.reason}"
            ),
            "email": recipient_email,
        }
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to send supervisor invite email", exc_info=exc)
        return {
            "message": "Supervisor account created, but invite email could not be sent. Check SMTP settings.",
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

    if supervisor.createdByAdminId and supervisor.createdByAdminId != admin_id:
        raise HTTPException(status_code=403, detail="You are not allowed to resend invite for this supervisor")

    if supervisor.user.supervisorInvite is None or supervisor.user.supervisorInvite.usedAt is not None:
        raise HTTPException(status_code=409, detail="Supervisor account is already activated")

    token = await invite_repo.create_supervisor_invite(supervisor.userId)
    invite_link = f"{settings.FRONTEND_URL}/accept-invite?token={token}&type=supervisor"
    recipient_email = supervisor.user.email
    full_name = f"{supervisor.user.firstName} {supervisor.user.lastName}".strip()

    try:
        await send_invite_email(
            to=recipient_email,
            name=full_name,
            role="Supervisor",
            invite_link=invite_link,
        )
        return {
            "message": "Supervisor invite resent successfully",
            "email": recipient_email,
        }
    except EmailDeliveryError as exc:
        logger.warning(
            "Resend supervisor invite failed for to=%s smtp_code=%s transient=%s reason=%s",
            exc.recipient,
            exc.smtp_code,
            exc.transient,
            exc.reason,
        )
        return {
            "message": f"Invite resend failed for {exc.recipient}: {exc.reason}",
            "email": recipient_email,
        }
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to resend supervisor invite email", exc_info=exc)
        return {
            "message": "Invite resend failed. Check SMTP settings.",
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
    })

    token = await invite_repo.create_worker_invite(worker.id)
    invite_link = f"{settings.FRONTEND_URL}/accept-invite?token={token}&type=worker"

    try:
        await send_invite_email(
            to=recipient_email,
            name=f"{data.first_name} {data.last_name}",
            role="Worker",
            invite_link=invite_link,
        )
        return {"message": "Worker invited successfully", "email": recipient_email}
    except EmailDeliveryError as exc:
        logger.warning(
            "Worker invite email failed for to=%s smtp_code=%s transient=%s reason=%s",
            exc.recipient,
            exc.smtp_code,
            exc.transient,
            exc.reason,
        )
        return {
            "message": (
                "Worker account created, but invite email was rejected for "
                f"{exc.recipient}: {exc.reason}"
            ),
            "email": recipient_email,
        }
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to send worker invite email", exc_info=exc)
        return {
            "message": "Worker account created, but invite email could not be sent. Check SMTP settings.",
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

    try:
        await send_invite_email(
            to=recipient_email,
            name=full_name,
            role="Worker",
            invite_link=invite_link,
        )
        return {
            "message": "Worker invite resent successfully",
            "email": recipient_email,
        }
    except EmailDeliveryError as exc:
        logger.warning(
            "Resend worker invite failed for to=%s smtp_code=%s transient=%s reason=%s",
            exc.recipient,
            exc.smtp_code,
            exc.transient,
            exc.reason,
        )
        return {
            "message": f"Invite resend failed for {exc.recipient}: {exc.reason}",
            "email": recipient_email,
        }
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to resend worker invite email", exc_info=exc)
        return {
            "message": "Invite resend failed. Check SMTP settings.",
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
