from pydantic import BaseModel, EmailStr


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


class AcceptInviteRequest(BaseModel):
    token: str
    password: str


class DepartmentCreate(BaseModel):
    name: str


class DepartmentUpdate(BaseModel):
    name: str
