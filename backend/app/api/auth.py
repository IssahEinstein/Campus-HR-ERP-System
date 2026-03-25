from typing import Annotated

from fastapi import APIRouter, Cookie, Response, Depends, File, UploadFile
from fastapi.security import HTTPBearer

from app.schemas.auth import (
    LoginRequest,
    TokenResponse,
    RefreshResponse,
    CurrentUser,
    ProfileResponse,
    ProfileUpdateRequest,
    PasswordChangeRequest,
)
from app.schemas.common import MessageResponse
from app.services import auth_service
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])

_REFRESH_COOKIE = "refresh_token"
_COOKIE_OPTS = {
    "key": _REFRESH_COOKIE,
    "httponly": True,
    "secure": True,       # HTTPS only in production; set False for local HTTP dev
    "samesite": "lax",
    "max_age": 60 * 60 * 24 * 7,  # 7 days in seconds
}


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, response: Response) -> TokenResponse:
    """
    Authenticate with email + password.
    Returns a short-lived access token in the body and sets a long-lived
    refresh token as an HttpOnly cookie.
    """
    token_response, refresh_token = await auth_service.login(
        email=body.email,
        password=body.password,
    )
    response.set_cookie(value=refresh_token, **_COOKIE_OPTS)
    return token_response


@router.post("/refresh", response_model=RefreshResponse)
async def refresh(
    response: Response,
    refresh_token: Annotated[str | None, Cookie(alias=_REFRESH_COOKIE)] = None,
) -> RefreshResponse:
    """
    Exchange a valid refresh token cookie for a new access token.
    Also rotates the refresh token cookie (new token, same expiry window).
    """
    if refresh_token is None:
        from app.exceptions import InvalidToken
        raise InvalidToken()

    refresh_response = await auth_service.refresh(refresh_token)

    # Rotate: issue a new refresh token for the same device
    from app.auth.tokens import decode_refresh_token, create_refresh_token
    from app.repositories.session import create_session
    import hashlib
    payload = decode_refresh_token(refresh_token)
    new_refresh = create_refresh_token(subject=payload["sub"], device_id=payload["device_id"])
    await create_session(
        user_id=payload["sub"],
        device_id=payload["device_id"],
        refresh_token_hash=hashlib.sha256(new_refresh.encode()).hexdigest(),
    )
    response.set_cookie(value=new_refresh, **_COOKIE_OPTS)

    return refresh_response


@router.post("/logout", status_code=204)
async def logout(
    response: Response,
    refresh_token: Annotated[str | None, Cookie(alias=_REFRESH_COOKIE)] = None,
) -> None:
    """Revoke the current session and clear the refresh cookie."""
    if refresh_token:
        await auth_service.logout(refresh_token)
    response.delete_cookie(key=_REFRESH_COOKIE, httponly=True, secure=True, samesite="lax")


@router.post("/logout-all", status_code=204)
async def logout_all(
    response: Response,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    refresh_token: Annotated[str | None, Cookie(alias=_REFRESH_COOKIE)] = None,
) -> None:
    """Revoke all sessions for the authenticated user (logout from all devices)."""
    await auth_service.logout_all(current_user.user_id)
    response.delete_cookie(key=_REFRESH_COOKIE, httponly=True, secure=True, samesite="lax")


@router.get("/me", response_model=CurrentUser)
async def me(current_user: Annotated[CurrentUser, Depends(get_current_user)]) -> CurrentUser:
    """Return the identity encoded in the access token."""
    return current_user


@router.get("/profile", response_model=ProfileResponse)
async def get_profile(current_user: Annotated[CurrentUser, Depends(get_current_user)]) -> ProfileResponse:
    """Return editable profile fields for the signed-in user."""
    return await auth_service.get_profile(current_user)


@router.put("/profile", response_model=ProfileResponse)
async def update_profile(
    body: ProfileUpdateRequest,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> ProfileResponse:
    """Update first name, last name, and optional profile description."""
    return await auth_service.update_profile(
        current_user=current_user,
        first_name=body.first_name,
        last_name=body.last_name,
        bio=body.bio,
    )


@router.post("/change-password", response_model=MessageResponse)
async def change_password(
    body: PasswordChangeRequest,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> MessageResponse:
    """Change the signed-in user's password."""
    await auth_service.change_password(
        current_user=current_user,
        current_password=body.current_password,
        new_password=body.new_password,
    )
    return MessageResponse(message="Password updated successfully")


@router.post("/avatar", response_model=ProfileResponse)
async def upload_avatar(
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    file: UploadFile = File(...),
) -> ProfileResponse:
    """Upload and set a new avatar image for the signed-in user."""
    content = await file.read()
    return await auth_service.update_avatar(
        current_user=current_user,
        filename=file.filename or "avatar.png",
        content=content,
        content_type=file.content_type,
    )


@router.delete("/avatar", response_model=ProfileResponse)
async def delete_avatar(
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> ProfileResponse:
    """Remove the signed-in user's avatar and fall back to initials."""
    return await auth_service.remove_avatar(current_user)
