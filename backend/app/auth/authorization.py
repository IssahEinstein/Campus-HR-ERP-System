from fastapi import HTTPException

from app.db import get_db

db = get_db()


async def ensure_supervisor_owns_worker(supervisor_profile_id: str, worker_id: str) -> None:
    """
    Raise 403 if the given worker is not in the supervisor's department.
    Also raises 404 if the worker doesn't exist.
    """
    supervisor = await db.supervisor.find_unique(where={"id": supervisor_profile_id})
    if not supervisor:
        raise HTTPException(status_code=403, detail="Supervisor profile not found")

    worker = await db.worker.find_unique(where={"id": worker_id})
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    if supervisor.departmentId != worker.departmentId:
        raise HTTPException(status_code=403, detail="Worker is not in your department")


async def ensure_shift_belongs_to_supervisor(supervisor_profile_id: str, shift_id: str) -> None:
    """
    Raise 403 if the shift was not created by this supervisor.
    Also raises 404 if the shift doesn't exist.
    """
    shift = await db.shift.find_unique(where={"id": shift_id})
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")

    if shift.supervisorId != supervisor_profile_id:
        raise HTTPException(status_code=403, detail="Shift does not belong to your account")
