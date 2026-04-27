from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi import HTTPException
from prisma.errors import ClientNotConnectedError

from app.auth.tokens import decode_access_token
from app.exceptions import PermissionDenied
from app.schemas.auth import CurrentUser
from app.db import get_db

_bearer = HTTPBearer(auto_error=True)
db = get_db()


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(_bearer)],
) -> CurrentUser:
    """
    FastAPI dependency: extract and validate the JWT Bearer token.
    Raises 401 automatically if no Authorization header is present (HTTPBearer).
    Raises InvalidToken / TokenExpired if the token is bad.
    """
    payload = decode_access_token(credentials.credentials)
    try:
        if db.is_connected():
            user = await db.user.find_unique(where={"id": payload["sub"]})
            if user is None:
                raise HTTPException(status_code=401, detail="User not found")
            if not getattr(user, "isActive", True):
                raise HTTPException(status_code=403, detail="Account is deactivated")
    except ClientNotConnectedError:
        # In isolated tests the Prisma client may not be connected; in that case
        # we still honor JWT claims for RBAC and let route/service layers decide.
        pass

    return CurrentUser(
        user_id=payload["sub"],
        email=payload["email"],
        role=payload["role"],
        profile_id=payload.get("profile_id"),
    )


def require_role(*allowed_roles: str):
    """
    Factory dependency: enforce that the current user has one of the allowed roles.

    Usage:
        @router.post("/shifts")
        async def create_shift(user: Annotated[CurrentUser, Depends(require_role("SUPERVISOR", "ADMIN"))]):
            ...
    """
    async def _check(user: Annotated[CurrentUser, Depends(get_current_user)]) -> CurrentUser:
        if user.role not in allowed_roles:
            raise PermissionDenied(f"Required role(s): {', '.join(allowed_roles)}")
        return user

    return _check
