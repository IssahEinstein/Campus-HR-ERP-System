# app/domain/worker.py
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Optional


class WorkerStatus(Enum):
    INVITED = "INVITED"
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    ON_LEAVE = "ON_LEAVE"


@dataclass
class Worker:
    id: str
    user_id: str
    department_id: str
    student_id: str
    worker_identifier: str
    status: WorkerStatus
    created_at: datetime
    updated_at: datetime