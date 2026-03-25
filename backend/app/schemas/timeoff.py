from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator
from pydantic.alias_generators import to_camel


class RequestStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"


class RequestType(str, Enum):
    TIME_OFF = "TIME_OFF"
    SHIFT_SWAP = "SHIFT_SWAP"


class TimeOffCreate(BaseModel):
    start_date: datetime
    end_date: datetime
    reason: Optional[str] = None

    @field_validator("end_date")
    @classmethod
    def end_must_be_after_start(cls, end_date, info):
        start_date = info.data.get("start_date")
        if start_date and end_date <= start_date:
            raise ValueError("end_date must be after start_date")
        return end_date


class TimeOffReview(BaseModel):
    status: RequestStatus
    approval_notes: Optional[str] = None


class TimeOffResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    id: str
    status: RequestStatus
    worker_id: str
    reviewed_by_id: Optional[str] = None
    start_date: datetime
    end_date: datetime
    reason: Optional[str] = None
    approval_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
