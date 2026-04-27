from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RefreshResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class CurrentUser(BaseModel):
    user_id: str
    email: str
    role: str
    profile_id: Optional[str] = None  # Admin.id / Supervisor.id / Worker.id


class WorkerAcademicResponse(BaseModel):
    student_id: Optional[str] = None
    worker_id: Optional[str] = None
    gpa: Optional[float] = None
    enrollment_status: Optional[str] = None
    course_load_credits: Optional[int] = None
    status: Optional[str] = None


class ProfileResponse(BaseModel):
    user_id: str
    email: str
    role: str
    profile_id: Optional[str] = None
    first_name: str
    last_name: str
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    worker_academic: Optional[WorkerAcademicResponse] = None


class ProfileUpdateRequest(BaseModel):
    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(min_length=1, max_length=80)
    bio: Optional[str] = Field(default=None, max_length=500)


class PasswordChangeRequest(BaseModel):
    current_password: str = Field(min_length=1)
    new_password: str = Field(min_length=8, max_length=128)
