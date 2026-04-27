import hashlib
import uuid
from pathlib import Path
from uuid import uuid4
from io import BytesIO

from app.auth.password import verify_password, hash_password
from app.auth.tokens import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
)
from app.exceptions import InvalidCredentials, SessionRevoked
from app.repositories.user import get_user_by_email, get_user_with_profile
from app.repositories.session import (
    create_session,
    get_active_session,
    revoke_session,
    revoke_all_user_sessions,
)
from app.schemas.auth import TokenResponse, RefreshResponse
from fastapi import HTTPException
from PIL import Image, UnidentifiedImageError
from app.db import get_db

_UPLOADS_DIR = Path(__file__).resolve().parents[3] / ".data" / "uploads" / "avatars"
_ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".jfif", ".png", ".webp", ".gif"}
_ALLOWED_IMAGE_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
_MAX_IMAGE_BYTES = 5 * 1024 * 1024
_AVATAR_SIZE = 512
db = get_db()


def _avatar_path_from_url(avatar_url: str | None) -> Path | None:
    if not avatar_url:
        return None
    prefix = "/uploads/avatars/"
    if not avatar_url.startswith(prefix):
        return None
    return _UPLOADS_DIR / avatar_url[len(prefix):]


def _safe_delete_avatar_file(avatar_url: str | None) -> None:
    path = _avatar_path_from_url(avatar_url)
    if path is None:
        return
    try:
        if path.exists() and path.is_file():
            path.unlink()
    except OSError:
        # Ignore cleanup errors to avoid blocking profile updates.
        pass


def _process_avatar_image(content: bytes) -> bytes:
    try:
        with Image.open(BytesIO(content)) as image:
            image = image.convert("RGB")

            width, height = image.size
            side = min(width, height)
            left = (width - side) // 2
            top = (height - side) // 2
            right = left + side
            bottom = top + side

            image = image.crop((left, top, right, bottom))
            image = image.resize((_AVATAR_SIZE, _AVATAR_SIZE), Image.Resampling.LANCZOS)

            output = BytesIO()
            image.save(output, format="JPEG", quality=90, optimize=True)
            return output.getvalue()
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError):
        raise HTTPException(status_code=400, detail="Invalid image file")


def _hash_token(token: str) -> str:
    """Store only a SHA-256 hash of the refresh token, not the token itself."""
    return hashlib.sha256(token.encode()).hexdigest()


def _extract_profile_id(user) -> str | None:
    """Return the role-specific profile record ID embedded in the JWT."""
    role = str(user.role)
    if "ADMIN" in role and user.adminProfile:
        return user.adminProfile.id
    if "SUPERVISOR" in role and user.supervisorProfile:
        return user.supervisorProfile.id
    if "WORKER" in role and user.workerProfile:
        return user.workerProfile.id
    return None


async def login(email: str, password: str, device_id: str | None = None) -> tuple[TokenResponse, str]:
    """
    Validate credentials, create a session, and return (TokenResponse, refresh_token).
    The refresh_token must be set as an HttpOnly cookie by the caller.
    device_id identifies the device/browser for per-device session management.
    """
    user = await get_user_by_email(email)
    if user is None:
        raise InvalidCredentials()

    if user.passwordHash == "INVITE_PENDING":
        raise HTTPException(
            status_code=403,
            detail="Account not yet activated. Please accept your invite email first.",
        )

    if not getattr(user, "isActive", True):
        raise HTTPException(status_code=403, detail="Account is deactivated. Contact an administrator.")

    if not verify_password(password, user.passwordHash):
        raise InvalidCredentials()

    user_full = await get_user_with_profile(user.id)
    if user_full is None:
        user_full = user

    supervisor_invite_pending = (
        str(user.role) == "SUPERVISOR"
        and user_full is not None
        and user_full.supervisorInvite is not None
        and user_full.supervisorInvite.usedAt is None
    )
    admin_invite_pending = (
        str(user.role) == "ADMIN"
        and user_full is not None
        and user_full.adminInvite is not None
        and user_full.adminInvite.usedAt is None
    )
    worker_invite_pending = (
        str(user.role) == "WORKER"
        and user_full is not None
        and user_full.workerProfile is not None
        and str(user_full.workerProfile.status) == "INVITED"
    )

    if supervisor_invite_pending or admin_invite_pending or worker_invite_pending:
        raise HTTPException(
            status_code=403,
            detail="Account not yet activated. Please accept your invite email first.",
        )

    if device_id is None:
        device_id = str(uuid.uuid4())

    profile_id = _extract_profile_id(user_full) if user_full else None

    access_token = create_access_token(
        subject=user.id,
        role=user.role,
        email=user.email,
        profile_id=profile_id,
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

    if not getattr(user, "isActive", True):
        await revoke_all_user_sessions(user_id)
        raise SessionRevoked()

    profile_id = _extract_profile_id(user)

    access_token = create_access_token(
        subject=user.id,
        role=user.role,
        email=user.email,
        profile_id=profile_id,
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


async def get_profile(current_user) -> dict:
    user = await get_user_with_profile(current_user.user_id)
    if user is None:
        raise SessionRevoked()

    profile = {
        "user_id": user.id,
        "email": user.email,
        "role": str(user.role),
        "profile_id": _extract_profile_id(user),
        "first_name": user.firstName,
        "last_name": user.lastName,
        "bio": getattr(user, "bio", None),
        "avatar_url": getattr(user, "avatarUrl", None),
    }

    if str(user.role) == "WORKER" and user.workerProfile:
        wp = user.workerProfile
        profile["worker_academic"] = {
            "student_id": wp.studentId,
            "worker_id": wp.workerId,
            "gpa": wp.gpa,
            "enrollment_status": str(wp.enrollmentStatus) if wp.enrollmentStatus else None,
            "course_load_credits": wp.courseLoadCredits,
            "status": str(wp.status) if wp.status else None,
        }

    return profile


async def update_profile(current_user, first_name: str, last_name: str, bio: str | None) -> dict:
    normalized_bio = (bio or "").strip() or None
    await db.user.update(
        where={"id": current_user.user_id},
        data={
            "firstName": first_name.strip(),
            "lastName": last_name.strip(),
            "bio": normalized_bio,
        },
    )
    return await get_profile(current_user)


async def change_password(current_user, current_password: str, new_password: str) -> None:
    user = await get_user_by_email(current_user.email)
    if user is None:
        raise SessionRevoked()

    if not verify_password(current_password, user.passwordHash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    await db.user.update(
        where={"id": current_user.user_id},
        data={"passwordHash": hash_password(new_password)},
    )


async def update_avatar(current_user, filename: str, content: bytes, content_type: str | None = None) -> dict:
    extension = Path(filename).suffix.lower()
    normalized_content_type = (content_type or "").split(";")[0].strip().lower()

    if extension and extension not in _ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported image format")

    if normalized_content_type and normalized_content_type not in _ALLOWED_IMAGE_MIME_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported image format")

    if not extension and not normalized_content_type:
        raise HTTPException(status_code=400, detail="Unsupported image format")

    if len(content) > _MAX_IMAGE_BYTES:
        raise HTTPException(status_code=400, detail="Image must be 5MB or less")

    processed_content = _process_avatar_image(content)

    _UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    avatar_filename = f"{current_user.user_id}-{uuid4().hex}.jpg"
    avatar_path = _UPLOADS_DIR / avatar_filename
    avatar_path.write_bytes(processed_content)

    avatar_url = f"/uploads/avatars/{avatar_filename}"

    existing_user = await db.user.find_unique(where={"id": current_user.user_id})
    old_avatar_url = getattr(existing_user, "avatarUrl", None) if existing_user else None

    await db.user.update(
        where={"id": current_user.user_id},
        data={"avatarUrl": avatar_url},
    )

    _safe_delete_avatar_file(old_avatar_url)

    return await get_profile(current_user)


async def remove_avatar(current_user) -> dict:
    existing_user = await db.user.find_unique(where={"id": current_user.user_id})
    if existing_user is None:
        raise SessionRevoked()

    old_avatar_url = getattr(existing_user, "avatarUrl", None)

    await db.user.update(
        where={"id": current_user.user_id},
        data={"avatarUrl": None},
    )

    _safe_delete_avatar_file(old_avatar_url)

    return await get_profile(current_user)
