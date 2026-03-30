from datetime import datetime

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class SupervisorLocationCreate(BaseModel):
    name: str


class SupervisorLocationResponse(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )

    id: str
    name: str
    created_at: datetime
