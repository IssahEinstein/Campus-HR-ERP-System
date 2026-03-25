from pydantic import BaseModel, EmailStr


class InviteSupervisorRequest(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    supervisor_id: str   # Human-readable 800 number
    department_id: str


class InviteWorkerRequest(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    worker_id: str       # Human-readable 800 number
    student_id: str


class AcceptInviteRequest(BaseModel):
    token: str
    password: str


class DepartmentCreate(BaseModel):
    name: str
