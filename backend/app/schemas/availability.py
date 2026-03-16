from pydantic import BaseModel, field_validator, ConfigDict
from datetime import datetime
from typing import Optional


class AvailabilityCreate(BaseModel):
    day_of_week: int       # 0 = Monday … 6 = Sunday
    start_time: str        # "HH:MM" e.g. "09:00"
    end_time: str          # "HH:MM" e.g. "17:00"

    @field_validator("day_of_week")
    @classmethod
    def valid_day(cls, v):
        if v not in range(7):
            raise ValueError("day_of_week must be 0 (Monday) to 6 (Sunday)")
        return v

    @field_validator("end_time")
    @classmethod
    def end_after_start(cls, end_time, info):
        start_time = info.data.get("start_time")
        if start_time and end_time <= start_time:
            raise ValueError("end_time must be after start_time")
        return end_time


class AvailabilityUpdate(BaseModel):
    start_time: Optional[str] = None
    end_time: Optional[str] = None


class AvailabilityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    worker_id: str
    day_of_week: int
    start_time: str
    end_time: str
    created_at: datetime
