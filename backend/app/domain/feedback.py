# app/domain/feedback.py
from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class Feedback:
    id: str
    supervisor_id: str
    worker_id: str
    rating: int
    comments: Optional[str]
    category: Optional[str]
    created_at: datetime
    updated_at: datetime