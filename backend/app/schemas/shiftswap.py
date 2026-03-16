from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional
from enum import Enum


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
    model_config = ConfigDict(from_attributes=True)

    id: str
    initiated_by_id: str
    target_worker_id: str
    from_assignment_id: Optional[str]
    to_assignment_id: Optional[str]
    reviewed_by_id: Optional[str]
    status: RequestStatus
    reason: Optional[str]
    approval_notes: Optional[str]
    created_at: datetime
