from typing import Optional

from app.db import db


async def get_user_by_email(email: str) -> Optional[dict]:
    """Fetch a user record by email, including passwordHash."""
    return await db.user.find_unique(where={"email": email})


async def get_user_with_profile(user_id: str) -> Optional[dict]:
    """Fetch a user with their role profile (admin/supervisor/worker)."""
    return await db.user.find_unique(
        where={"id": user_id},
        include={
            "adminProfile": True,
            "supervisorProfile": True,
            "workerProfile": True,
        },
    )
