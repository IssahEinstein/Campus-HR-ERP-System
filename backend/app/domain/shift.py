# app/domain/shift.py
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Optional


class ShiftStatus(Enum):
    SCHEDULED = "SCHEDULED"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"


@dataclass
class Shift:
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