from fastapi import HTTPException

from app.db import get_db

db = get_db()


async def create_department(name: str, admin_id: str):
    if await db.department.find_unique(where={"name": name}):
        raise HTTPException(status_code=409, detail="Department with this name already exists")
    return await db.department.create(data={"name": name, "adminId": admin_id})


async def list_departments():
    return await db.department.find_many(order={"name": "asc"})


async def get_department(dept_id: str):
    dept = await db.department.find_unique(where={"id": dept_id})
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    return dept
