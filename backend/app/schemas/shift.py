from pydantic import BaseModel, field_validator, ConfigDict
from datetime import datetime
from typing import Optional
from enum import Enum


class ShiftStatus(str, Enum):
    SCHEDULED = "SCHEDULED"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"


class AssignmentStatus(str, Enum):
    ASSIGNED = "ASSIGNED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class ShiftCreate(BaseModel):
    title: str
    description: Optional[str] = None
    location: Optional[str] = None
    start_time: datetime
    end_time: datetime
    expected_hours: Optional[float] = None

    @field_validator("end_time")
    @classmethod
    def end_must_be_after_start(cls, end_time, info):
        start_time = info.data.get("start_time")
        if start_time and end_time <= start_time:
            raise ValueError("end_time must be after start_time")
        return end_time


class ShiftUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    expected_hours: Optional[float] = None
    status: Optional[ShiftStatus] = None


class AssignWorkerRequest(BaseModel):
    worker_id: str


class AssignmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    shift_id: str
    worker_id: str
    assigned_by_id: str
    status: AssignmentStatus
    created_at: datetime


class ShiftResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    supervisor_id: str
    title: str
    description: Optional[str]
    location: Optional[str]
    start_time: datetime
    end_time: datetime
    status: ShiftStatus
    expected_hours: Optional[float]
    created_at: datetime
    updated_at: datetime
