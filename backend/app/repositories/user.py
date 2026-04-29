from typing import Optional

from app.db import get_db


db = get_db()


async def get_user_by_email(email: str) -> Optional[dict]:
    """Fetch a user record by email, including all profile relations in one query."""
    normalized_email = email.strip().lower()
    include = {
        "adminProfile": True,
        "supervisorProfile": True,
        "workerProfile": True,
        "adminInvite": True,
        "supervisorInvite": True,
    }

    # Fallback guards against runtime incompatibilities in some deployments
    # where string filter mode="insensitive" may error unexpectedly.
    try:
        return await db.user.find_first(
            where={"email": {"equals": normalized_email, "mode": "insensitive"}},
            include=include,
        )
    except Exception:
        return await db.user.find_unique(
            where={"email": normalized_email},
            include=include,
        )


async def get_user_with_profile(user_id: str) -> Optional[dict]:
    """Fetch a user with their role profile (admin/supervisor/worker)."""
    return await db.user.find_unique(
        where={"id": user_id},
        include={
            "adminProfile": True,
            "supervisorProfile": True,
            "workerProfile": True,
            "adminInvite": True,
            "supervisorInvite": True,
        },
    )
