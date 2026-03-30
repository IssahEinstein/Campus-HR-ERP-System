from fastapi import HTTPException

from app.auth.password import hash_password
from app.core.config import settings
from app.db import get_db
from app.schemas.invite import BootstrapAdminRequest
from app.schemas.common import SemesterSettingsUpdate

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


async def get_semester_settings() -> dict:
    rows = await db.query_raw(
        'SELECT "semesterStartDate", "semesterEndDate" FROM "SemesterSetting" WHERE "key" = \'default\' LIMIT 1'
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Semester dates are not configured")
    settings_row = rows[0]

    return {
        "semester_start_date": settings_row["semesterStartDate"],
        "semester_end_date": settings_row["semesterEndDate"],
    }


async def upsert_semester_settings(body: SemesterSettingsUpdate) -> dict:
    start_iso = body.semester_start_date.isoformat()
    end_iso = body.semester_end_date.isoformat()
    await db.execute_raw(
        'INSERT INTO "SemesterSetting" ("key", "semesterStartDate", "semesterEndDate", "createdAt", "updatedAt") '
        f"VALUES ('default', '{start_iso}', '{end_iso}', NOW(), NOW()) "
        'ON CONFLICT ("key") DO UPDATE SET '
        f'"semesterStartDate" = \'{start_iso}\', '
        f'"semesterEndDate" = \'{end_iso}\', '
        '"updatedAt" = NOW()'
    )

    return {
        "semester_start_date": body.semester_start_date,
        "semester_end_date": body.semester_end_date,
    }