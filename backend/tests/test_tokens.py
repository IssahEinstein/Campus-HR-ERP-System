"""
Unit tests for JWT token creation and validation.
No HTTP calls, no DB — pure logic tests.
"""
from datetime import datetime, timedelta, timezone
from typing import Any

import pytest
from jose import jwt

from app.auth.tokens import (
    create_access_token,
    create_refresh_token,
    decode_access_token,
    decode_refresh_token,
)
from app.core.config import settings
from app.exceptions import InvalidToken, TokenExpired


# ---------------------------------------------------------------------------
# Access token
# ---------------------------------------------------------------------------

def test_access_token_roundtrip():
    token = create_access_token("user-123", "ADMIN", "test@test.com", "profile-abc")
    payload = decode_access_token(token)

    assert payload["sub"] == "user-123"
    assert payload["role"] == "ADMIN"
    assert payload["email"] == "test@test.com"
    assert payload["profile_id"] == "profile-abc"
    assert payload["type"] == "access"


def test_access_token_without_profile_id():
    token = create_access_token("user-123", "ADMIN", "test@test.com")
    payload = decode_access_token(token)
    assert payload["profile_id"] is None


def test_refresh_token_used_as_access_token_raises():
    """A refresh token must not be accepted where an access token is expected."""
    refresh = create_refresh_token("user-123", "device-abc")
    with pytest.raises(InvalidToken):
        decode_access_token(refresh)


def test_expired_access_token_raises():
    payload: dict[str, Any] = {
        "sub": "user-123",
        "role": "ADMIN",
        "email": "test@test.com",
        "profile_id": None,
        "exp": datetime.now(timezone.utc) - timedelta(seconds=1),
        "type": "access",
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    with pytest.raises(TokenExpired):
        decode_access_token(token)


def test_tampered_access_token_raises():
    token = create_access_token("user-123", "ADMIN", "test@test.com") + "tampered"
    with pytest.raises(InvalidToken):
        decode_access_token(token)


def test_wrong_secret_raises():
    payload: dict[str, Any] = {
        "sub": "user-123",
        "role": "ADMIN",
        "email": "test@test.com",
        "profile_id": None,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=15),
        "type": "access",
    }
    token = jwt.encode(payload, "wrong-secret-key", algorithm=settings.ALGORITHM)
    with pytest.raises(InvalidToken):
        decode_access_token(token)


# ---------------------------------------------------------------------------
# Refresh token
# ---------------------------------------------------------------------------

def test_refresh_token_roundtrip():
    token = create_refresh_token("user-123", "my-device")
    payload = decode_refresh_token(token)

    assert payload["sub"] == "user-123"
    assert payload["device_id"] == "my-device"
    assert payload["type"] == "refresh"


def test_access_token_used_as_refresh_token_raises():
    """An access token must not be accepted where a refresh token is expected."""
    access = create_access_token("user-123", "ADMIN", "test@test.com")
    with pytest.raises(InvalidToken):
        decode_refresh_token(access)


def test_expired_refresh_token_raises():
    payload: dict[str, Any] = {
        "sub": "user-123",
        "device_id": "device-abc",
        "exp": datetime.now(timezone.utc) - timedelta(seconds=1),
        "type": "refresh",
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    with pytest.raises(TokenExpired):
        decode_refresh_token(token)
