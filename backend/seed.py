"""
Seed script — populates the database with demo data for local development.

Run with:
    .venv/Scripts/python.exe seed.py

What it creates (idempotent — safe to run multiple times):
  • 1 department          — "Computer Science"
  • 1 supervisor          — supervisor@demo.com  / Demo1234!
  • 1 worker              — worker@demo.com      / Demo1234!
  • 4 upcoming shifts     — Mon–Thu next week
  • 4 shift assignments   — worker assigned to every shift
  • 4 attendance records  — worker already checked in/out for each
  • 1 availability slot   — Mon 09:00-17:00
  • 1 time-off request    — pending, 30 days from now

Uses the EXISTING admin account (first Admin row in the database).
"""

import asyncio
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv
load_dotenv()

from app.auth.password import hash_password
from app.db import connect_db, disconnect_db, get_db

db = get_db()

SUPERVISOR_EMAIL = "supervisor@demo.com"
SUPERVISOR_PASSWORD = "Demo1234!"
SUPERVISOR_ID = "SUP-DEMO-001"

WORKER_EMAIL = "worker@demo.com"
WORKER_PASSWORD = "Demo1234!"
WORKER_ID = "WRK-DEMO-001"
STUDENT_ID = "STU-DEMO-001"

DEPARTMENT_NAME = "Computer Science"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _next_weekday(weekday: int, hour: int = 9) -> datetime:
    """Return the next occurrence of `weekday` (0=Mon … 6=Sun) at `hour` UTC."""
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    days_ahead = (weekday - today.weekday()) % 7 or 7
    return today + timedelta(days=days_ahead, hours=hour)


async def get_or_create(find_fn, create_fn, label: str):
    """Run find_fn; if None, run create_fn. Returns the record."""
    record = await find_fn()
    if record:
        print(f"  ↳ {label} already exists — skipping")
    else:
        record = await create_fn()
        print(f"  ✅ Created {label}")
    return record


# ---------------------------------------------------------------------------
# Seed steps
# ---------------------------------------------------------------------------

async def seed_department(admin_id: str):
    return await get_or_create(
        lambda: db.department.find_unique(where={"name": DEPARTMENT_NAME}),
        lambda: db.department.create(data={"name": DEPARTMENT_NAME, "adminId": admin_id}),
        f"department '{DEPARTMENT_NAME}'",
    )


async def seed_supervisor(department_id: str, admin_id: str):
    async def find():
        return await db.user.find_unique(where={"email": SUPERVISOR_EMAIL})

    async def create():
        user = await db.user.create(data={
            "email": SUPERVISOR_EMAIL,
            "passwordHash": hash_password(SUPERVISOR_PASSWORD),
            "firstName": "Demo",
            "lastName": "Supervisor",
            "role": "SUPERVISOR",
        })
        await db.supervisor.create(data={
            "userId": user.id,
            "supervisorId": SUPERVISOR_ID,
            "departmentId": department_id,
            "createdByAdminId": admin_id,
        })
        return user

    user = await get_or_create(find, create, f"supervisor {SUPERVISOR_EMAIL}")
    supervisor = await db.supervisor.find_unique(where={"userId": user.id})
    return supervisor


async def seed_worker(department_id: str):
    async def find():
        return await db.user.find_unique(where={"email": WORKER_EMAIL})

    async def create():
        user = await db.user.create(data={
            "email": WORKER_EMAIL,
            "passwordHash": hash_password(WORKER_PASSWORD),
            "firstName": "Demo",
            "lastName": "Worker",
            "role": "WORKER",
        })
        await db.worker.create(data={
            "userId": user.id,
            "workerId": WORKER_ID,
            "studentId": STUDENT_ID,
            "departmentId": department_id,
            "status": "ACTIVE",
        })
        return user

    user = await get_or_create(find, create, f"worker {WORKER_EMAIL}")
    worker = await db.worker.find_unique(where={"userId": user.id})
    return worker


async def seed_shifts(supervisor_id: str):
    """Create 4 shifts Mon–Thu of next week if they don't already exist."""
    days = [
        (0, "Monday Morning Shift",   "Library Help Desk"),
        (1, "Tuesday Afternoon Shift", "IT Support Desk"),
        (2, "Wednesday Morning Shift", "Library Help Desk"),
        (3, "Thursday Evening Shift",  "Student Center"),
    ]

    shifts = []
    for weekday, title, location in days:
        start = _next_weekday(weekday, hour=9)
        end   = start + timedelta(hours=4)

        existing = await db.shift.find_first(
            where={"supervisorId": supervisor_id, "title": title}
        )
        if existing:
            print(f"  ↳ shift '{title}' already exists — skipping")
            shifts.append(existing)
        else:
            shift = await db.shift.create(data={
                "supervisorId": supervisor_id,
                "title": title,
                "location": location,
                "startTime": start,
                "endTime": end,
                "expectedHours": 4.0,
            })
            print(f"  ✅ Created shift '{title}' on {start.strftime('%a %b %d')}")
            shifts.append(shift)
    return shifts


async def seed_assignments(shifts: list, worker_id: str, supervisor_id: str):
    """Assign the demo worker to every demo shift."""
    assignments = []
    for shift in shifts:
        existing = await db.shiftassignment.find_first(
            where={"shiftId": shift.id, "workerId": worker_id}
        )
        if existing:
            print(f"  ↳ assignment for '{shift.title}' already exists — skipping")
            assignments.append(existing)
        else:
            assignment = await db.shiftassignment.create(data={
                "shiftId": shift.id,
                "workerId": worker_id,
                "assignedById": supervisor_id,
            })
            print(f"  ✅ Assigned worker to '{shift.title}'")
            assignments.append(assignment)
    return assignments


async def seed_attendance(assignments: list, worker_id: str):
    """Create completed check-in/out records for every assignment."""
    for assignment in assignments:
        existing = await db.checkinout.find_first(
            where={"shiftAssignmentId": assignment.id, "workerId": worker_id}
        )
        if existing:
            print(f"  ↳ attendance for assignment {assignment.id[:8]}… already exists — skipping")
            continue

        shift = await db.shift.find_unique(where={"id": assignment.shiftId})
        checked_out_at = shift.startTime + timedelta(hours=4)
        await db.checkinout.create(data={
            "workerId": worker_id,
            "shiftAssignmentId": assignment.id,
            "checkedInAt": shift.startTime,
            "checkedOutAt": checked_out_at,
            "hoursWorked": 4.0,
            "notes": "Demo attendance record",
        })
        print(f"  ✅ Created attendance for '{shift.title}'")


async def seed_availability(worker_id: str):
    existing = await db.availability.find_first(
        where={"workerId": worker_id, "dayOfWeek": 0}  # Monday
    )
    if existing:
        print("  ↳ availability slot already exists — skipping")
        return

    await db.availability.create(data={
        "workerId": worker_id,
        "dayOfWeek": 0,
        "startTime": "09:00",
        "endTime": "17:00",
    })
    print("  ✅ Created availability: Monday 09:00-17:00")


async def seed_timeoff_request(worker_id: str):
    existing = await db.timeoffrequest.find_first(
        where={"workerId": worker_id, "status": "PENDING"}
    )
    if existing:
        print("  ↳ pending time-off request already exists — skipping")
        return

    start = datetime.now(timezone.utc) + timedelta(days=30)
    end   = start + timedelta(days=3)
    await db.timeoffrequest.create(data={
        "workerId": worker_id,
        "startDate": start,
        "endDate": end,
        "reason": "Demo vacation request",
    })
    print("  ✅ Created time-off request (30 days from now, 3 days)")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

async def main():
    await connect_db()
    print()

    # Require an existing admin
    admin = await db.admin.find_first()
    if not admin:
        print("❌  No admin found. Run bootstrap first.")
        return

    print("📦  Seeding demo data…")
    print()

    print("1. Department")
    dept = await seed_department(admin.id)

    print("\n2. Supervisor")
    supervisor = await seed_supervisor(dept.id, admin.id)

    print("\n3. Worker")
    worker = await seed_worker(dept.id)

    print("\n4. Shifts")
    shifts = await seed_shifts(supervisor.id)

    print("\n5. Shift assignments")
    assignments = await seed_assignments(shifts, worker.id, supervisor.id)

    print("\n6. Attendance records")
    await seed_attendance(assignments, worker.id)

    print("\n7. Availability")
    await seed_availability(worker.id)

    print("\n8. Time-off request")
    await seed_timeoff_request(worker.id)

    print()
    print("─" * 50)
    print("✅  Seed complete!")
    print()
    print("Demo credentials:")
    print(f"  Supervisor  {SUPERVISOR_EMAIL}  /  {SUPERVISOR_PASSWORD}")
    print(f"  Worker      {WORKER_EMAIL}  /  {WORKER_PASSWORD}")
    print()

    await disconnect_db()


if __name__ == "__main__":
    asyncio.run(main())
