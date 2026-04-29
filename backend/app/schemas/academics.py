from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class CourseCreate(BaseModel):
    department_id: str
    teacher_id: str
    code: str
    name: str
    credits: int = Field(default=1, ge=1)


class CourseResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    id: str
    department_id: str
    teacher_id: Optional[str] = None
    code: str
    name: str
    credits: int
    created_at: datetime
    updated_at: datetime


class EnrollmentRequest(BaseModel):
    student_id: str


class GradeRequest(BaseModel):
    student_id: str
    teacher_id: str
    grade_value: float = Field(ge=0, le=4)
    letter_grade: Optional[str] = None


class GraduationRequestResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    id: str
    student_id: str
    status: str
    note: Optional[str] = None
    created_at: datetime
    updated_at: datetime
