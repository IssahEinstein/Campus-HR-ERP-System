from fastapi import HTTPException

from app.schemas.common import MessageResponse

from app.db import get_db

db = get_db()


def _validate_budget_pair(budget_allocated: float, budget_spent: float) -> None:
    if budget_allocated < 0 or budget_spent < 0:
        raise HTTPException(status_code=400, detail="Budget values cannot be negative")
    if budget_spent > budget_allocated:
        raise HTTPException(status_code=400, detail="budget_spent cannot exceed budget_allocated")


async def create_department(
    name: str,
    admin_id: str,
    budget_allocated: float = 0,
    budget_spent: float = 0,
):
    normalized_name = name.strip()
    if not normalized_name:
        raise HTTPException(status_code=400, detail="Department name is required")
    if await db.department.find_unique(where={"name": normalized_name}):
        raise HTTPException(status_code=409, detail="Department with this name already exists")

    _validate_budget_pair(budget_allocated, budget_spent)

    return await db.department.create(
        data={
            "name": normalized_name,
            "adminId": admin_id,
            "budgetAllocated": float(budget_allocated),
            "budgetSpent": float(budget_spent),
        }
    )


async def list_departments():
    return await db.department.find_many(order={"name": "asc"})


async def get_department(dept_id: str):
    dept = await db.department.find_unique(where={"id": dept_id})
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    return dept


async def update_department(
    dept_id: str,
    name: str | None = None,
    budget_allocated: float | None = None,
    budget_spent: float | None = None,
):
    dept = await get_department(dept_id)
    update_data: dict = {}

    if name is not None:
        normalized_name = name.strip()
        if not normalized_name:
            raise HTTPException(status_code=400, detail="Department name is required")
        if dept.name != normalized_name:
            existing = await db.department.find_unique(where={"name": normalized_name})
            if existing and existing.id != dept_id:
                raise HTTPException(status_code=409, detail="Department with this name already exists")
            update_data["name"] = normalized_name

    target_allocated = float(budget_allocated) if budget_allocated is not None else float(dept.budgetAllocated)
    target_spent = float(budget_spent) if budget_spent is not None else float(dept.budgetSpent)

    if budget_allocated is not None or budget_spent is not None:
        _validate_budget_pair(target_allocated, target_spent)
        if budget_allocated is not None:
            update_data["budgetAllocated"] = target_allocated
        if budget_spent is not None:
            update_data["budgetSpent"] = target_spent

    if not update_data:
        raise HTTPException(status_code=400, detail="No department fields provided for update")

    return await db.department.update(where={"id": dept_id}, data=update_data)


async def rename_department(dept_id: str, name: str):
    # Backward-compatible wrapper used by older callers.
    return await update_department(dept_id, name=name)


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
        "budget_allocated": float(dept.budgetAllocated or 0),
        "budget_spent": float(dept.budgetSpent or 0),
        "budget_remaining": round(float(dept.budgetAllocated or 0) - float(dept.budgetSpent or 0), 2),
    }


async def get_all_department_stats() -> list[dict]:
    """Return workforce metrics for every department — used by the admin dashboard."""
    departments = await db.department.find_many(order={"name": "asc"})
    return [
        await get_department_stats(dept.id)
        for dept in departments
    ]
