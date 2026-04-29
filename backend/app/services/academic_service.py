from fastapi import HTTPException

from app.db import get_db

db = get_db()


async def create_course(
    department_id: str,
    teacher_id: str,
    code: str,
    name: str,
    credits: int = 1,
):
    department = await db.department.find_unique(where={"id": department_id})
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    if str(department.type) != "ACADEMICS":
        raise HTTPException(status_code=400, detail="Courses can only be created in the Academics department")

    teacher = await db.worker.find_unique(where={"id": teacher_id})
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher profile not found")
    if str(teacher.workerType) != "TEACHER":
        raise HTTPException(status_code=400, detail="Only teacher workers can be assigned to courses")

    return await db.course.create(
        data={
            "departmentId": department_id,
            "teacherId": teacher_id,
            "code": code.strip(),
            "name": name.strip(),
            "credits": credits,
        }
    )


async def enroll_student(student_id: str, course_id: str):
    student = await db.worker.find_unique(where={"id": student_id})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    if str(student.workerType) != "STUDENT":
        raise HTTPException(status_code=400, detail="Only student workers can be enrolled in courses")
    if student.status != "ACTIVE":
        raise HTTPException(status_code=400, detail="Student must be active before enrolling in classes")

    course = await db.course.find_unique(where={"id": course_id})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    return await db.courseEnrollment.create(
        data={
            "studentId": student_id,
            "courseId": course_id,
            "status": "ENROLLED",
        }
    )


async def post_grade(
    course_id: str,
    student_id: str,
    teacher_id: str,
    grade_value: float,
    letter_grade: str | None = None,
):
    if grade_value < 0 or grade_value > 4:
        raise HTTPException(status_code=400, detail="Grade value must be between 0.0 and 4.0")

    course = await db.course.find_unique(where={"id": course_id})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if course.teacherId != teacher_id:
        raise HTTPException(status_code=403, detail="Only the assigned teacher can submit grades for this course")

    enrollment = await db.courseEnrollment.find_unique(
        where={"studentId_courseId": {"studentId": student_id, "courseId": course_id}},
    )
    if not enrollment:
        raise HTTPException(status_code=404, detail="Student is not enrolled in this course")

    grade = await db.grade.upsert(
        where={"courseEnrollmentId": enrollment.id},
        create={
            "courseEnrollmentId": enrollment.id,
            "gradeValue": float(grade_value),
            "letterGrade": letter_grade,
        },
        update={
            "gradeValue": float(grade_value),
            "letterGrade": letter_grade,
        },
    )

    await calculate_gpa(student_id)
    return grade


async def calculate_gpa(student_id: str) -> float | None:
    enrollments = await db.courseEnrollment.find_many(
        where={
            "studentId": student_id,
            "grade": {"isNot": None},
        },
        include={"course": True, "grade": True},
    )

    graded_enrollments = [e for e in enrollments if e.grade is not None]
    if not graded_enrollments:
        await db.worker.update(where={"id": student_id}, data={"gpa": None})
        return None

    total_weighted = 0.0
    total_credits = 0
    for enrollment in graded_enrollments:
        if enrollment.course is None:
            continue
        total_weighted += float(enrollment.grade.gradeValue) * int(enrollment.course.credits)
        total_credits += int(enrollment.course.credits)

    if total_credits == 0:
        await db.worker.update(where={"id": student_id}, data={"gpa": None})
        return None

    gpa = round(total_weighted / total_credits, 2)
    await db.worker.update(where={"id": student_id}, data={"gpa": gpa})
    return gpa


async def submit_graduation_request(student_id: str, note: str | None = None):
    student = await db.worker.find_unique(where={"id": student_id})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    if str(student.workerType) != "STUDENT":
        raise HTTPException(status_code=400, detail="Only students may submit graduation requests")

    return await db.graduationRequest.create(
        data={
            "studentId": student_id,
            "note": note,
        }
    )
