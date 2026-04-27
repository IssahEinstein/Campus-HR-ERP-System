from fastapi import HTTPException
from app.schemas.common import MessageResponse

from app.db import get_db

db = get_db()


async def create_department(name: str, admin_id: str):
    normalized_name = name.strip()
    if not normalized_name:
        raise HTTPException(status_code=400, detail="Department name is required")
    if await db.department.find_unique(where={"name": normalized_name}):
        raise HTTPException(status_code=409, detail="Department with this name already exists")
    return await db.department.create(data={"name": normalized_name, "adminId": admin_id})


async def list_departments():
    return await db.department.find_many(order={"name": "asc"})


async def get_department(dept_id: str):
    dept = await db.department.find_unique(where={"id": dept_id})
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    return dept


async def rename_department(dept_id: str, name: str):
    dept = await get_department(dept_id)
    normalized_name = name.strip()

    if not normalized_name:
        raise HTTPException(status_code=400, detail="Department name is required")

    if dept.name == normalized_name:
        return dept

    existing = await db.department.find_unique(where={"name": normalized_name})
    if existing and existing.id != dept_id:
        raise HTTPException(status_code=409, detail="Department with this name already exists")

    return await db.department.update(
        where={"id": dept_id},
        data={"name": normalized_name},
    )


async def delete_department(dept_id: str) -> MessageResponse:
    dept = await get_department(dept_id)

    supervisor_count = await db.supervisor.count(where={"departmentId": dept_id})
    worker_count = await db.worker.count(where={"departmentId": dept_id})

    if supervisor_count > 0 or worker_count > 0:
        raise HTTPException(
            status_code=409,
            detail="Cannot delete a department that still has assigned supervisors or workers",
        )

    await db.department.delete(where={"id": dept_id})
    return MessageResponse(message=f"Department '{dept.name}' deleted successfully")


async def get_department_stats(dept_id: str) -> dict:
    """Return workforce and workload metrics for a single department."""
    dept = await get_department(dept_id)
    supervisor_count = await db.supervisor.count(where={"departmentId": dept_id})
    worker_count = await db.worker.count(where={"departmentId": dept_id})
    active_worker_count = await db.worker.count(where={"departmentId": dept_id, "status": "ACTIVE"})
    return {
        "id": dept.id,
        "name": dept.name,
        "supervisor_count": supervisor_count,
        "worker_count": worker_count,
        "active_worker_count": active_worker_count,
        "student_count": worker_count,
    }


async def get_all_department_stats() -> list[dict]:
    """Return workforce metrics for every department — used by the admin dashboard."""
    departments = await db.department.find_many(order={"name": "asc"})
    return [
        await get_department_stats(dept.id)
        for dept in departments
    ]
