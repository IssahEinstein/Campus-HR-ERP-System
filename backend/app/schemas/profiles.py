"""
Pydantic response schemas for User, Department, Supervisor, and Worker
profiles as returned by the API.

All models use alias_generator=to_camel so they can be validated directly
from Prisma model instances (which have camelCase attribute names like
`firstName`, `departmentId`, etc.) while still serialising to camelCase JSON
— which is what the React frontend expects.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class UserBasic(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    id: str
    email: str
    first_name: str
    last_name: str
    role: str
    created_at: datetime


class DepartmentResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    id: str
    name: str
    admin_id: str
    created_at: datetime


class SupervisorResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    id: str
    supervisor_id: str
    user_id: str
    department_id: str
    created_at: datetime
    invite_pending: bool = False
    user: Optional[UserBasic] = None
    department: Optional[DepartmentResponse] = None


class WorkerResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    id: str
    worker_id: str
    student_id: str
    user_id: str
    status: str
    department_id: str
    created_at: datetime
    user: Optional[UserBasic] = None
    department: Optional[DepartmentResponse] = None


class AdminResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    id: str
    admin_id: str
    user_id: str
    created_at: datetime
    invite_pending: bool = False
    user: Optional[UserBasic] = None
