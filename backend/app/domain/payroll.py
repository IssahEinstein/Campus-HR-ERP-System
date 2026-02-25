# app/domain/payroll.py
from dataclasses import dataclass
from datetime import datetime
from enum import Enum


class PayStubStatus(Enum):
    GENERATED = "GENERATED"
    APPROVED = "APPROVED"
    PAID = "PAID"


@dataclass
class PayStub:
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
    notes: str | None
    created_at: datetime
    updated_at: datetime