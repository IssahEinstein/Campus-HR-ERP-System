from typing import Optional

from pydantic import BaseModel


class MessageResponse(BaseModel):
    """Generic success response for actions that just confirm completion."""
    message: str
    email: Optional[str] = None


class BootstrapResponse(BaseModel):
    """Response returned by the one-time admin bootstrap endpoint."""
    message: str
    user_id: str
    admin_profile_id: str
    email: str
