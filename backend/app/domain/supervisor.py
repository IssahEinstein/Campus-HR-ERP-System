# app/domain/supervisor.py
from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class Supervisor:
    id: str
    user_id: str
    department_id: str
    supervisor_identifier: str
    created_by_admin_id: Optional[str]
    created_at: datetime
    updated_at: datetime