import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from app.db import get_db

db = get_db()

_INVITE_TTL_HOURS = 48


def _hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


# ── Supervisor Invites ────────────────────────────────────────────────────────

async def create_supervisor_invite(user_id: str) -> str:
    """Create (or replace) a supervisor invite. Returns the raw token."""
    token = secrets.token_hex(32)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=_INVITE_TTL_HOURS)
    await db.supervisorinvite.upsert(
        where={"userId": user_id},
        data={
            "create": {
                "userId": user_id,
                "tokenHash": _hash(token),
                "expiresAt": expires_at,
            },
            "update": {
                "tokenHash": _hash(token),
                "expiresAt": expires_at,
                "usedAt": None,
            },
        },
    )
    return token


async def get_supervisor_invite_by_token(token: str):
    return await db.supervisorinvite.find_unique(
        where={"tokenHash": _hash(token)},
        include={"user": True},
    )


async def mark_supervisor_invite_used(invite_id: str) -> None:
    await db.supervisorinvite.update(
        where={"id": invite_id},
        data={"usedAt": datetime.now(timezone.utc)},
    )


# ── Worker Invites ────────────────────────────────────────────────────────────

async def create_worker_invite(worker_id: str) -> str:
    """Create (or replace) a worker invite. Returns the raw token."""
    token = secrets.token_hex(32)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=_INVITE_TTL_HOURS)
    # WorkerInvite has no unique on workerId, so delete old invites then create
    await db.workerinvite.delete_many(where={"workerId": worker_id})
    await db.workerinvite.create(
        data={"workerId": worker_id, "tokenHash": _hash(token), "expiresAt": expires_at},
    )
    return token


async def get_worker_invite_by_token(token: str):
    return await db.workerinvite.find_unique(
        where={"tokenHash": _hash(token)},
        include={"worker": {"include": {"user": True}}},
    )


async def mark_worker_invite_used(invite_id: str) -> None:
    await db.workerinvite.update(
        where={"id": invite_id},
        data={"usedAt": datetime.now(timezone.utc)},
    )
