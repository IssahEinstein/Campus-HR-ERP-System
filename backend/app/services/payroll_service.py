from fastapi import HTTPException

from app.db import db
from app.schemas.payroll import PayrollGenerate, PayStubStatusUpdate


async def generate_paystub(data: PayrollGenerate, supervisor_id: str):
    """
    Generate a pay stub for a worker for a given pay period.
    Pulls total hours from CheckInOut records where checkedOutAt falls
    within the pay period and hoursWorked is recorded.
    """
    worker = await db.worker.find_unique(where={"id": data.worker_id})
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    # Block duplicate pay stub for the same worker + period
    existing = await db.paystub.find_first(
        where={
            "workerId": data.worker_id,
            "payPeriodStart": data.pay_period_start,
            "payPeriodEnd": data.pay_period_end,
        }
    )
    if existing:
        raise HTTPException(
            status_code=409,
            detail="A pay stub already exists for this worker and pay period"
        )

    # Sum all completed attendance records within the pay period
    attendance_records = await db.checkinout.find_many(
        where={
            "workerId": data.worker_id,
            "checkedOutAt": {
                "gte": data.pay_period_start,
                "lte": data.pay_period_end,
            },
            "hoursWorked": {"not": None},
        }
    )

    total_hours = sum(r.hoursWorked for r in attendance_records if r.hoursWorked)
    gross_pay = round(total_hours * data.hourly_rate, 2)
    tax_withheld = round(gross_pay * data.tax_rate, 2)
    net_pay = round(gross_pay - tax_withheld - data.deductions, 2)

    paystub = await db.paystub.create(
        data={
            "workerId": data.worker_id,
            "payPeriodStart": data.pay_period_start,
            "payPeriodEnd": data.pay_period_end,
            "totalHours": round(total_hours, 2),
            "hourlyRate": data.hourly_rate,
            "grossPay": gross_pay,
            "taxWithheld": tax_withheld,
            "deductions": data.deductions,
            "netPay": net_pay,
            "notes": data.notes,
        }
    )
    return paystub


async def update_status(paystub_id: str, data: PayStubStatusUpdate, supervisor_id: str):
    """Supervisor marks a pay stub as APPROVED or PAID."""
    paystub = await db.paystub.find_unique(where={"id": paystub_id})
    if not paystub:
        raise HTTPException(status_code=404, detail="Pay stub not found")

    # Enforce valid status transitions
    transitions = {
        "GENERATED": ["APPROVED"],
        "APPROVED": ["PAID"],
        "PAID": [],
    }
    allowed = transitions.get(paystub.status, [])
    if data.status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot transition from {paystub.status} to {data.status}"
        )

    return await db.paystub.update(
        where={"id": paystub_id},
        data={"status": data.status},
    )


async def get_paystub(paystub_id: str):
    """Fetch a single pay stub by ID."""
    paystub = await db.paystub.find_unique(where={"id": paystub_id})
    if not paystub:
        raise HTTPException(status_code=404, detail="Pay stub not found")
    return paystub


async def list_paystubs_for_worker(worker_id: str):
    """List all pay stubs for a specific worker, newest first."""
    return await db.paystub.find_many(
        where={"workerId": worker_id},
        order={"payPeriodStart": "desc"},
    )


async def list_all_paystubs(status: str = None):
    """Supervisor lists all pay stubs, optionally filtered by status."""
    where = {}
    if status:
        where["status"] = status
    return await db.paystub.find_many(
        where=where,
        order={"createdAt": "desc"},
    )
