# app/domain/user.py
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Optional


class UserRole(Enum):
    ADMIN = "ADMIN"
    SUPERVISOR = "SUPERVISOR"
    WORKER = "WORKER"


@dataclass
class User:
    id: str
    email: str
    first_name: str
    last_name: str
    role: UserRole
    created_at: datetime
    updated_at: datetime