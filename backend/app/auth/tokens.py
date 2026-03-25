from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, ExpiredSignatureError, jwt

from app.core.config import settings
from app.exceptions import InvalidToken, TokenExpired


def create_access_token(subject: str, role: str, email: str) -> str:
    """Create a short-lived JWT access token."""
    expires = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload: dict[str, Any] = {
        "sub": subject,
        "role": role,
        "email": email,
        "exp": expires,
        "type": "access",
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(subject: str, device_id: str) -> str:
    """Create a long-lived JWT refresh token (stored in HttpOnly cookie)."""
    expires = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    payload: dict[str, Any] = {
        "sub": subject,
        "device_id": device_id,
        "exp": expires,
        "type": "refresh",
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    """Decode and validate an access token. Raises InvalidToken or TokenExpired."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "access":
            raise InvalidToken()
        return payload
    except ExpiredSignatureError:
        raise TokenExpired()
    except JWTError:
        raise InvalidToken()


def decode_refresh_token(token: str) -> dict[str, Any]:
    """Decode and validate a refresh token. Raises InvalidToken or TokenExpired."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "refresh":
            raise InvalidToken()
        return payload
    except ExpiredSignatureError:
        raise TokenExpired()
    except JWTError:
        raise InvalidToken()
