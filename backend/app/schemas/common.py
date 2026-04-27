from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator
from pydantic.alias_generators import to_camel


class MessageResponse(BaseModel):
    """Generic success response for actions that just confirm completion."""
    message: str
    email: Optional[str] = None


class BootstrapResponse(BaseModel):
    """Response returned by the one-time admin bootstrap endpoint."""
    message: str
    user_id: str
    admin_profile_id: str
    email: str


class SemesterSettingsResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    semester_start_date: datetime
    semester_end_date: datetime


class SemesterSettingsUpdate(BaseModel):
    semester_start_date: datetime
    semester_end_date: datetime

    @field_validator("semester_end_date")
    @classmethod
    def end_after_start(cls, value, info):
        start = info.data.get("semester_start_date")
        if start and value <= start:
            raise ValueError("semester_end_date must be after semester_start_date")
        return value
