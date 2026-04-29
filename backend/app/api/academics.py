from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.auth.dependencies import require_role
from app.db import get_db
from app.schemas.academics import (
    CourseCreate,
    CourseResponse,
    EnrollmentRequest,
    GradeRequest,
    GraduationRequestResponse,
)
from app.services.academic_service import (
    create_course,
    enroll_student,
    post_grade,
    submit_graduation_request,
)

router = APIRouter(prefix="/academics", tags=["Academics"])

db = get_db()


@router.post("/courses", response_model=CourseResponse)
async def create_course_endpoint(
    body: CourseCreate,
    current_user: Annotated[object, Depends(require_role("SUPERVISOR", "ADMIN"))],
):
    return await create_course(
        department_id=body.department_id,
        teacher_id=body.teacher_id,
        code=body.code,
        name=body.name,
        credits=body.credits,
    )


@router.post("/courses/{course_id}/enroll", response_model=CourseResponse)
async def enroll_student_endpoint(
    course_id: str,
    body: EnrollmentRequest,
    current_user: Annotated[object, Depends(require_role("WORKER", "SUPERVISOR", "ADMIN"))],
):
    if current_user.role == "WORKER" and current_user.user_id != body.student_id:
        raise HTTPException(status_code=403, detail="Students may only enroll themselves in courses")

    await enroll_student(body.student_id, course_id)
    course = await db.course.find_unique(where={"id": course_id})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


@router.post("/courses/{course_id}/grades", response_model=CourseResponse)
async def post_grade_endpoint(
    course_id: str,
    body: GradeRequest,
    current_user: Annotated[object, Depends(require_role("WORKER", "SUPERVISOR", "ADMIN"))],
):
    if current_user.role == "WORKER" and current_user.user_id != body.teacher_id:
        raise HTTPException(status_code=403, detail="Teachers may only submit grades for their own courses")

    await post_grade(
        course_id=course_id,
        student_id=body.student_id,
        teacher_id=body.teacher_id,
        grade_value=body.grade_value,
        letter_grade=body.letter_grade,
    )
    course = await db.course.find_unique(where={"id": course_id})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


@router.post("/students/{student_id}/graduation-requests", response_model=GraduationRequestResponse)
async def submit_graduation_request_endpoint(
    student_id: str,
    current_user: Annotated[object, Depends(require_role("WORKER", "SUPERVISOR", "ADMIN"))],
    note: str | None = None,
):
    if current_user.role == "WORKER" and current_user.user_id != student_id:
        raise HTTPException(status_code=403, detail="Students may only submit graduation requests for themselves")

    return await submit_graduation_request(student_id=student_id, note=note)
