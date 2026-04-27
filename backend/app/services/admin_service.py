from fastapi import HTTPException

from app.auth.password import hash_password
from app.core.config import settings
from app.db import get_db
from app.schemas.invite import BootstrapAdminRequest
from app.schemas.common import SemesterSettingsUpdate

db = get_db()


def _is_system_admin(admin_record) -> bool:
    """Return True if this admin was bootstrapped (no AdminInvite record = system admin)."""
    if admin_record is None:
        return False
    return not (admin_record.user and admin_record.user.adminInvite)


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
    """Delete a supervisor and their linked user account."""
    supervisor = await db.supervisor.find_unique(
        where={"id": supervisor_id},
        include={"user": True},
    )
    if not supervisor:
        raise HTTPException(status_code=404, detail="Supervisor not found")

    await db.timeoffrequest.update_many(
        where={"reviewedById": supervisor_id},
        data={"reviewedById": None},
    )
    await db.shiftswaprequest.update_many(
        where={"reviewedById": supervisor_id},
        data={"reviewedById": None},
    )

    await db.user.delete(where={"id": supervisor.userId})

    return {
        "message": "Supervisor deleted successfully",
        "email": supervisor.user.email,
    }


async def set_admin_active_state(
    admin_profile_id: str,
    is_active: bool,
    acting_admin_profile_id: str,
) -> dict:
    acting = await db.admin.find_unique(
        where={"id": acting_admin_profile_id},
        include={"user": {"include": {"adminInvite": True}}},
    )
    if not _is_system_admin(acting):
        raise HTTPException(
            status_code=403,
            detail="Only system admins can change other admin accounts",
        )

    target = await db.admin.find_unique(
        where={"id": admin_profile_id},
        include={"user": True},
    )
    if not target:
        raise HTTPException(status_code=404, detail="Admin not found")

    if admin_profile_id == acting_admin_profile_id and not is_active:
        raise HTTPException(status_code=400, detail="You cannot deactivate your own admin account")

    if bool(getattr(target.user, "isActive", True)) == bool(is_active):
        return {
            "message": f"Admin is already {'active' if is_active else 'inactive'}",
            "email": target.user.email,
            "is_active": bool(is_active),
        }

    await db.user.update(where={"id": target.userId}, data={"isActive": bool(is_active)})

    return {
        "message": f"Admin {'activated' if is_active else 'deactivated'} successfully",
        "email": target.user.email,
        "is_active": bool(is_active),
    }


async def delete_admin(admin_profile_id: str, acting_admin_profile_id: str) -> dict:
    acting = await db.admin.find_unique(
        where={"id": acting_admin_profile_id},
        include={"user": {"include": {"adminInvite": True}}},
    )
    if not _is_system_admin(acting):
        raise HTTPException(
            status_code=403,
            detail="Only system admins can delete admin accounts",
        )

    target = await db.admin.find_unique(
        where={"id": admin_profile_id},
        include={"user": True},
    )
    if not target:
        raise HTTPException(status_code=404, detail="Admin not found")

    if admin_profile_id == acting_admin_profile_id:
        raise HTTPException(status_code=400, detail="You cannot delete your own admin account")

    await db.user.delete(where={"id": target.userId})
    return {
        "message": "Admin deleted successfully",
        "email": target.user.email,
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


async def get_system_stats() -> dict:
    """System-wide operational overview."""
    total_admins = await db.admin.count()
    total_supervisors = await db.supervisor.count()
    total_workers = await db.worker.count()
    active_workers = await db.worker.count(where={"status": "ACTIVE"})
    total_departments = await db.department.count()

    all_admins = await db.admin.find_many(
        include={"user": {"include": {"adminInvite": True}}}
    )
    system_admin_count = sum(1 for a in all_admins if _is_system_admin(a))

    return {
        "total_admins": total_admins,
        "total_supervisors": total_supervisors,
        "total_workers": total_workers,
        "active_workers": active_workers,
        "total_departments": total_departments,
        "admin_levels": {
            "system_admins": system_admin_count,
            "department_admins": total_admins - system_admin_count,
        },
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
