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
    is_active: bool = True
    created_at: datetime


class DepartmentResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    id: str
    name: str
    admin_id: Optional[str] = None
    budget_allocated: float = 0
    budget_spent: float = 0
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
    gpa: Optional[float] = None
    enrollment_status: Optional[str] = None
    course_load_credits: Optional[int] = None
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
    is_system_admin: bool = False
    is_active: bool = True
    user: Optional[UserBasic] = None


class DepartmentStatsResponse(BaseModel):
    """Department-level workforce and workload metrics."""
    id: str
    name: str
    supervisor_count: int
    worker_count: int
    active_worker_count: int
    student_count: int
    budget_allocated: float = 0
    budget_spent: float = 0
    budget_remaining: float = 0


class SystemStatsResponse(BaseModel):
    """System-wide operational overview for system-level admins."""
    total_admins: int
    total_supervisors: int
    total_workers: int
    active_workers: int
    total_departments: int
    admin_levels: dict


class SystemUsageResponse(BaseModel):
    """Most-used API features since server start."""
    usage: dict[str, int]
    top_feature: Optional[str] = None


class DeptPayrollResponse(BaseModel):
    """Payroll cost rollup for a single department."""
    department_id: str
    department_name: str
    total_gross_pay: float
    total_net_pay: float
    total_hours: float
    paystub_count: int


class DashboardSummaryResponse(BaseModel):
    """Full admin dashboard summary — system stats, dept breakdown, payroll, top features."""
    system: SystemStatsResponse
    departments: list[DepartmentStatsResponse]
    payroll_by_department: list[DeptPayrollResponse]
    top_features: dict[str, int]
