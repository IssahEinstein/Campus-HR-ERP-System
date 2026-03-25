from datetime import datetime, timedelta, timezone
from typing import Optional

from app.db import db
from app.core.config import settings


async def create_session(user_id: str, device_id: str, refresh_token_hash: str) -> dict:
    """Upsert a session for the given user+device pair (one session per device)."""
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    return await db.session.upsert(
        where={"userId_deviceId": {"userId": user_id, "deviceId": device_id}},
        data={
            "create": {
                "userId": user_id,
                "deviceId": device_id,
                "refreshTokenHash": refresh_token_hash,
                "expiresAt": expires_at,
            },
            "update": {
                "refreshTokenHash": refresh_token_hash,
                "expiresAt": expires_at,
                "revokedAt": None,
            },
        },
    )


async def get_active_session(user_id: str, device_id: str) -> Optional[dict]:
    """Return the session if it exists, is not revoked, and has not expired."""
    session = await db.session.find_unique(
        where={"userId_deviceId": {"userId": user_id, "deviceId": device_id}}
    )
    if session is None:
        return None
    if session.revokedAt is not None:
        return None
    if session.expiresAt < datetime.now(timezone.utc):
        return None
    return session


async def revoke_session(user_id: str, device_id: str) -> None:
    """Revoke a single session (logout from one device)."""
    await db.session.update_many(
        where={"userId": user_id, "deviceId": device_id},
        data={"revokedAt": datetime.now(timezone.utc)},
    )


async def revoke_all_user_sessions(user_id: str) -> None:
    """Revoke all sessions for a user (logout from all devices)."""
    await db.session.update_many(
        where={"userId": user_id, "revokedAt": None},
        data={"revokedAt": datetime.now(timezone.utc)},
    )
