# app/domain/assignment.py
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Optional


class AssignmentStatus(Enum):
    ASSIGNED = "ASSIGNED"
    ACCEPTED = "ACCEPTED"
    DECLINED = "DECLINED"
    COMPLETED = "COMPLETED"


@dataclass
class ShiftAssignment:
    id: str
    shift_id: str
    worker_id: str
    assigned_by_id: str
    status: AssignmentStatus
    created_at: datetime
    updated_at: datetime