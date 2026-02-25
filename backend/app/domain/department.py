# app/domain/department.py
from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class Department:
    id: str
    name: str
    admin_id: Optional[str]
    created_at: datetime
    updated_at: datetime