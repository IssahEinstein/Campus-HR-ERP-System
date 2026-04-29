from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, validator
from pydantic.alias_generators import to_camel


class PaymentRequest(BaseModel):
    amount: float = Field(gt=0)
    payment_type: str = "ENROLLMENT"
    description: Optional[str] = None
    semester: Optional[str] = None

    @validator("payment_type")
    @classmethod
    def normalize_type(cls, value: str) -> str:
        return (value or "").strip().upper()


class PaymentResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    id: str
    worker_id: str
    department_id: Optional[str] = None
    type: str
    status: str
    amount: float
    description: Optional[str] = None
    semester: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class PaymentSummaryResponse(BaseModel):
    worker_id: str
    completed_amount: float
