from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

from app.schemas.profiles import UserBasic


class FeedbackCreateRequest(BaseModel):
    rating: int = Field(ge=1, le=5)
    comments: str = Field(min_length=1)
    category: Optional[str] = None


class FeedbackSupervisorSummary(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    id: str
    supervisor_id: str
    user_id: str
    user: Optional[UserBasic] = None


class FeedbackResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    id: str
    supervisor_id: str
    worker_id: str
    rating: int
    comments: Optional[str] = None
    category: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    supervisor: Optional[FeedbackSupervisorSummary] = None
