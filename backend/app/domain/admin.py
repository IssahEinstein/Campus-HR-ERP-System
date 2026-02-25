# app/domain/admin.py
from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class Admin:
    id: str
    user_id: str
    admin_identifier: str  # 800 number or human-readable ID
    created_at: datetime
    updated_at: datetime