from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator
from pydantic.alias_generators import to_camel


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

    @field_validator("start_time", "end_time")
    @classmethod
    def normalize_time(cls, value):
        return _normalize_time_text(value)

    @field_validator("end_time")
    @classmethod
    def end_after_start(cls, end_time, info):
        start_time = info.data.get("start_time")
        if start_time and _time_text_to_minutes(end_time) <= _time_text_to_minutes(start_time):
            raise ValueError("end_time must be after start_time")
        return end_time


class AvailabilityUpdate(BaseModel):
    start_time: Optional[str] = None
    end_time: Optional[str] = None

    @field_validator("start_time", "end_time")
    @classmethod
    def normalize_optional_time(cls, value):
        if value is None:
            return value
        return _normalize_time_text(value)


class AvailabilityResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    id: str
    worker_id: str
    day_of_week: int
    start_time: str
    end_time: str
    created_at: datetime


def _normalize_time_text(value: str) -> str:
    """Accept 12h/24h time input and normalize to HH:MM (24h)."""
    text = " ".join(str(value or "").strip().split())
    candidates = [
        "%H:%M",
        "%H:%M:%S",
        "%I:%M %p",
        "%I:%M:%S %p",
    ]

    for fmt in candidates:
        try:
            parsed = datetime.strptime(text, fmt)
            return parsed.strftime("%H:%M")
        except ValueError:
            continue

    raise ValueError("time must be in HH:MM, HH:MM:SS, or h:mm AM/PM format")


def _time_text_to_minutes(value: str) -> int:
    normalized = _normalize_time_text(value)
    hours, minutes = normalized.split(":")
    return (int(hours) * 60) + int(minutes)
