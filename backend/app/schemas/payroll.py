from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator
from pydantic.alias_generators import to_camel


class PayStubStatus(str, Enum):
    GENERATED = "GENERATED"
    APPROVED = "APPROVED"
    PAID = "PAID"


class PayrollGenerate(BaseModel):
    worker_id: str
    pay_period_start: datetime
    pay_period_end: datetime
    hourly_rate: float
    tax_rate: float = 0.0        # e.g. 0.15 = 15%
    deductions: float = 0.0      # flat deduction amount
    notes: Optional[str] = None

    @field_validator("pay_period_end")
    @classmethod
    def end_must_be_after_start(cls, end, info):
        start = info.data.get("pay_period_start")
        if start and end <= start:
            raise ValueError("pay_period_end must be after pay_period_start")
        return end

    @field_validator("hourly_rate")
    @classmethod
    def rate_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError("hourly_rate must be positive")
        return v

    @field_validator("tax_rate")
    @classmethod
    def tax_rate_valid(cls, v):
        if not (0.0 <= v < 1.0):
            raise ValueError("tax_rate must be between 0.0 and 1.0")
        return v


class PayStubStatusUpdate(BaseModel):
    status: PayStubStatus


class PayStubResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    id: str
    worker_id: str
    pay_period_start: datetime
    pay_period_end: datetime
    total_hours: float
    hourly_rate: float
    gross_pay: float
    tax_withheld: float
    deductions: float
    net_pay: float
    status: PayStubStatus
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
