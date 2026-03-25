from fastapi import HTTPException

from app.auth.password import hash_password
from app.core.config import settings
from app.db import get_db
from app.schemas.invite import BootstrapAdminRequest

db = get_db()


async def bootstrap_admin(body: BootstrapAdminRequest, provided_key: str | None) -> dict:
    """Create the first admin account exactly once, guarded by a bootstrap key."""
    existing_admin = await db.admin.find_first()
    if existing_admin:
        raise HTTPException(status_code=409, detail="Admin bootstrap is already completed")

    if not settings.ADMIN_BOOTSTRAP_KEY:
        raise HTTPException(status_code=503, detail="ADMIN_BOOTSTRAP_KEY is not configured")

    if provided_key != settings.ADMIN_BOOTSTRAP_KEY:
        raise HTTPException(status_code=403, detail="Invalid bootstrap key")

    if await db.user.find_unique(where={"email": body.email}):
        raise HTTPException(status_code=409, detail="Email already registered")

    if await db.admin.find_first(where={"adminId": body.admin_id}):
        raise HTTPException(status_code=409, detail="Admin ID already in use")

    user = await db.user.create(
        data={
            "email": body.email,
            "passwordHash": hash_password(body.password),
            "firstName": body.first_name,
            "lastName": body.last_name,
            "role": "ADMIN",
        }
    )

    admin = await db.admin.create(
        data={
            "userId": user.id,
            "adminId": body.admin_id,
        }
    )

    return {
        "message": "Initial admin created successfully",
        "user_id": user.id,
        "admin_profile_id": admin.id,
        "email": user.email,
    }


async def delete_supervisor(supervisor_id: str) -> dict:
    """Delete a supervisor and their linked user account.

    This preserves historical request records by clearing reviewedBy references
    before deleting the supervisor profile via user cascade.
    """
    supervisor = await db.supervisor.find_unique(
        where={"id": supervisor_id},
        include={"user": True},
    )
    if not supervisor:
        raise HTTPException(status_code=404, detail="Supervisor not found")

    # Keep request history intact while removing the reviewer relation.
    await db.timeoffrequest.update_many(
        where={"reviewedById": supervisor_id},
        data={"reviewedById": None},
    )
    await db.shiftswaprequest.update_many(
        where={"reviewedById": supervisor_id},
        data={"reviewedById": None},
    )

    # Deleting the user cascades to supervisor profile, sessions, invites,
    # and downstream supervisor-owned entities.
    await db.user.delete(where={"id": supervisor.userId})

    return {
        "message": "Supervisor deleted successfully",
        "email": supervisor.user.email,
    }