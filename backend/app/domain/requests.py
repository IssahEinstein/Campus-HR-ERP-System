# app/domain/requests.py
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Optional


class RequestType(Enum):
    TIME_OFF = "TIME_OFF"
    SHIFT_SWAP = "SHIFT_SWAP"


class RequestStatus(Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"


@dataclass
class TimeOffRequest:
    id: str
    worker_id: str
    status: RequestStatus
    start_date: datetime
    end_date: datetime
    reason: Optional[str]
    reviewed_by_id: Optional[str]
    approval_notes: Optional[str]
    created_at: datetime
    updated_at: datetime


@dataclass
class ShiftSwapRequest:
    id: str
    initiated_by_id: str
    target_worker_id: str
    from_assignment_id: Optional[str]
    to_assignment_id: Optional[str]
    status: RequestStatus
    reason: Optional[str]
    reviewed_by_id: Optional[str]
    approval_notes: Optional[str]
    created_at: datetime
    updated_at: datetime