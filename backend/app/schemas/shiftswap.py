from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class RequestStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"


class ShiftSwapCreate(BaseModel):
    target_worker_id: str
    from_assignment_id: str
    to_assignment_id: Optional[str] = None
    reason: Optional[str] = None


class ShiftSwapReview(BaseModel):
    status: str          # "APPROVED" or "REJECTED"
    approval_notes: Optional[str] = None


class ShiftSwapResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    id: str
    initiated_by_id: str
    target_worker_id: str
    from_assignment_id: Optional[str] = None
    to_assignment_id: Optional[str] = None
    reviewed_by_id: Optional[str] = None
    status: RequestStatus
    reason: Optional[str] = None
    approval_notes: Optional[str] = None
    created_at: datetime
