from pydantic import BaseModel, EmailStr, Field


class BootstrapAdminRequest(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    admin_id: str


class InviteSupervisorRequest(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    supervisor_id: str   # Human-readable 800 number
    department_id: str


class InviteAdminRequest(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    admin_id: str  # Human-readable 800 number


class InviteWorkerRequest(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    worker_id: str       # Human-readable 800 number
    student_id: str
    role: str = "WORKER"
    gpa: float | None = Field(default=None, ge=0, le=4)
    enrollment_status: str | None = None
    course_load_credits: int | None = Field(default=None, ge=0)


class AcceptInviteRequest(BaseModel):
    token: str
    password: str


class DepartmentCreate(BaseModel):
    name: str
    budget_allocated: float | None = Field(default=0, ge=0)
    budget_spent: float | None = Field(default=0, ge=0)


class DepartmentUpdate(BaseModel):
    name: str | None = None
    budget_allocated: float | None = Field(default=None, ge=0)
    budget_spent: float | None = Field(default=None, ge=0)
