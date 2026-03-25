from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.auth.tokens import decode_access_token
from app.exceptions import PermissionDenied
from app.schemas.auth import CurrentUser

_bearer = HTTPBearer(auto_error=True)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(_bearer)],
) -> CurrentUser:
    """
    FastAPI dependency: extract and validate the JWT Bearer token.
    Raises 401 automatically if no Authorization header is present (HTTPBearer).
    Raises InvalidToken / TokenExpired if the token is bad.
    """
    payload = decode_access_token(credentials.credentials)
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
