from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class CheckInRequest(BaseModel):
    shift_assignment_id: str
    notes: Optional[str] = None


class CheckOutRequest(BaseModel):
    notes: Optional[str] = None


class AttendanceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    worker_id: str
    shift_assignment_id: str
    checked_in_at: datetime
    checked_out_at: Optional[datetime]
    hours_worked: Optional[float]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
