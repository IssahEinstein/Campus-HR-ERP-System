import hashlib
import uuid

from app.auth.password import verify_password
from app.auth.tokens import create_access_token, create_refresh_token, decode_refresh_token
from app.exceptions import InvalidCredentials, SessionRevoked
from app.repositories.user import get_user_by_email, get_user_with_profile
from app.repositories.session import create_session, get_active_session, revoke_session, revoke_all_user_sessions
from app.schemas.auth import TokenResponse, RefreshResponse


def _hash_token(token: str) -> str:
    """Store only a SHA-256 hash of the refresh token, not the token itself."""
    return hashlib.sha256(token.encode()).hexdigest()


async def login(email: str, password: str, device_id: str | None = None) -> tuple[TokenResponse, str]:
    """
    Validate credentials, create a session, and return (TokenResponse, refresh_token).
    The refresh_token must be set as an HttpOnly cookie by the caller.
    device_id identifies the device/browser for per-device session management.
    """
    user = await get_user_by_email(email)
    if user is None or not verify_password(password, user.passwordHash):
        raise InvalidCredentials()

    if device_id is None:
        device_id = str(uuid.uuid4())

    access_token = create_access_token(
        subject=user.id,
        role=user.role,
        email=user.email,
    )
    refresh_token = create_refresh_token(subject=user.id, device_id=device_id)

    await create_session(
        user_id=user.id,
        device_id=device_id,
        refresh_token_hash=_hash_token(refresh_token),
    )

    return TokenResponse(access_token=access_token), refresh_token


async def refresh(refresh_token: str) -> RefreshResponse:
    """
    Validate a refresh token cookie, verify the session is still active,
    and issue a new access token.
    """
    payload = decode_refresh_token(refresh_token)  # raises TokenExpired / InvalidToken
    user_id: str = payload["sub"]
    device_id: str = payload["device_id"]

    session = await get_active_session(user_id, device_id)
    if session is None:
        raise SessionRevoked()

    # Verify the stored hash matches the presented token
    if session.refreshTokenHash != _hash_token(refresh_token):
        # Possible token theft — revoke all sessions for this user
        await revoke_all_user_sessions(user_id)
        raise SessionRevoked()

    user = await get_user_with_profile(user_id)
    if user is None:
        raise SessionRevoked()

    access_token = create_access_token(
        subject=user.id,
        role=user.role,
        email=user.email,
    )
    return RefreshResponse(access_token=access_token)


async def logout(refresh_token: str) -> None:
    """Revoke the session associated with this refresh token."""
    try:
        payload = decode_refresh_token(refresh_token)
        await revoke_session(payload["sub"], payload["device_id"])
    except Exception:
        # Even if the token is expired/invalid, treat as a successful logout
        pass


async def logout_all(user_id: str) -> None:
    """Revoke all sessions for a user (logout from all devices)."""
    await revoke_all_user_sessions(user_id)
