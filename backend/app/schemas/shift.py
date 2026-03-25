from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator
from pydantic.alias_generators import to_camel


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


class ShiftResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    id: str
    supervisor_id: str
    title: str
    description: Optional[str] = None
    location: Optional[str] = None
    start_time: datetime
    end_time: datetime
    status: ShiftStatus
    expected_hours: Optional[float] = None
    created_at: datetime
    updated_at: datetime


class AssignmentResponse(BaseModel):
    """
    ShiftAssignment record. The `shift` field is populated when the route
    queries with include={"shift": True} (e.g. GET /shifts/my-assignments).
    """
    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    id: str
    shift_id: str
    worker_id: str
    assigned_by_id: str
    status: AssignmentStatus
    created_at: datetime
    shift: Optional[ShiftResponse] = None
