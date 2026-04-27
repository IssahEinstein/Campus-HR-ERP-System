from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CheckInRequest(BaseModel):
    shift_assignment_id: str
    notes: Optional[str] = None


class CheckOutRequest(BaseModel):
    notes: Optional[str] = None


class AttendanceResponse(BaseModel):
    """Represents a single check-in/check-out attendance record."""
    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    id: str
    worker_id: str
    shift_assignment_id: str
    checked_in_at: datetime
    checked_out_at: Optional[datetime] = None
    hours_worked: Optional[float] = None
    notes: Optional[str] = None
    shift_title: Optional[str] = None
    created_at: datetime
    updated_at: datetime
