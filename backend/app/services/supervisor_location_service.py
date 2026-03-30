from uuid import uuid4

from fastapi import HTTPException

from app.db import get_db


db = get_db()


def _escape_sql(value: str) -> str:
    return value.replace("'", "''")


async def list_locations(supervisor_id: str) -> list[dict]:
    rows = await db.query_raw(
        'SELECT "id", "name", "createdAt" '
        'FROM "SupervisorLocation" '
        f'WHERE "supervisorId" = \'{_escape_sql(supervisor_id)}\' '
        'ORDER BY "name" ASC'
    )
    return [
        {
            "id": row["id"],
            "name": row["name"],
            "created_at": row["createdAt"],
        }
        for row in rows
    ]


async def create_location(supervisor_id: str, name: str) -> dict:
    supervisor = await db.supervisor.find_unique(where={"id": supervisor_id})
    if not supervisor:
        raise HTTPException(status_code=404, detail="Supervisor profile not found")

    normalized_name = name.strip()
    if not normalized_name:
        raise HTTPException(status_code=400, detail="Location name is required")

    if len(normalized_name) > 120:
        raise HTTPException(status_code=400, detail="Location name is too long")

    existing_rows = await db.query_raw(
        'SELECT "id" FROM "SupervisorLocation" '
        f'WHERE "supervisorId" = \'{_escape_sql(supervisor_id)}\' '
        f'AND LOWER("name") = LOWER(\'{_escape_sql(normalized_name)}\') '
        'LIMIT 1'
    )
    if existing_rows:
        raise HTTPException(status_code=409, detail="Location already exists")

    created_id = uuid4().hex
    await db.execute_raw(
        'INSERT INTO "SupervisorLocation" '
        '("id", "supervisorId", "name", "createdAt", "updatedAt") '
        f'VALUES (\'{_escape_sql(created_id)}\', \'{_escape_sql(supervisor_id)}\', \'{_escape_sql(normalized_name)}\', NOW(), NOW())'
    )

    created_rows = await db.query_raw(
        'SELECT "id", "name", "createdAt" FROM "SupervisorLocation" '
        f'WHERE "id" = \'{_escape_sql(created_id)}\' LIMIT 1'
    )
    if not created_rows:
        raise HTTPException(status_code=500, detail="Failed to read created location")
    created = created_rows[0]

    return {
        "id": created["id"],
        "name": created["name"],
        "created_at": created["createdAt"],
    }


async def delete_location(supervisor_id: str, location_id: str) -> dict:
    rows = await db.query_raw(
        'SELECT "id", "name" FROM "SupervisorLocation" '
        f'WHERE "id" = \'{_escape_sql(location_id)}\' '
        f'AND "supervisorId" = \'{_escape_sql(supervisor_id)}\' '
        'LIMIT 1'
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Location not found")

    await db.execute_raw(
        'DELETE FROM "SupervisorLocation" '
        f'WHERE "id" = \'{_escape_sql(location_id)}\' '
        f'AND "supervisorId" = \'{_escape_sql(supervisor_id)}\''
    )

    return {"message": "Location deleted successfully", "email": None}
