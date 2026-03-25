from fastapi import APIRouter

from app.schemas.common import MessageResponse
from app.schemas.invite import AcceptInviteRequest
from app.services import invite_service

router = APIRouter(prefix="/invites", tags=["Invites"])


@router.post("/accept-supervisor", response_model=MessageResponse)
async def accept_supervisor_invite(body: AcceptInviteRequest):
    """
    Public endpoint — supervisor accepts their invite and sets a password.
    The token comes from the email link.
    """
    return await invite_service.accept_supervisor_invite(body.token, body.password)


@router.post("/accept-worker", response_model=MessageResponse)
async def accept_worker_invite(body: AcceptInviteRequest):
    """
    Public endpoint — worker accepts their invite, sets a password, and is activated.
    The token comes from the email link.
    """
    return await invite_service.accept_worker_invite(body.token, body.password)
