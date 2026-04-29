from fastapi import HTTPException

from app.db import get_db

db = get_db()

_ALLOWED_PAYMENT_TYPES = {"ENROLLMENT", "TUITION"}


async def record_payment(
    worker_id: str,
    amount: float,
    payment_type: str = "ENROLLMENT",
    description: str | None = None,
    semester: str | None = None,
):
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Payment amount must be greater than zero")

    payment_type = payment_type.strip().upper()
    if payment_type not in _ALLOWED_PAYMENT_TYPES:
        raise HTTPException(status_code=400, detail="Invalid payment_type. Use ENROLLMENT or TUITION")

    worker = await db.worker.find_unique(where={"id": worker_id})
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    if str(worker.workerType) != "STUDENT":
        raise HTTPException(status_code=400, detail="Only students can submit tuition or enrollment payments")

    return await db.payment.create(
        data={
            "workerId": worker_id,
            "departmentId": worker.departmentId,
            "type": payment_type,
            "status": "COMPLETED",
            "amount": float(amount),
            "description": description,
            "semester": semester,
        }
    )


async def list_payments(worker_id: str | None = None):
    where = {} if worker_id is None else {"workerId": worker_id}
    return await db.payment.find_many(
        where=where,
        order={"createdAt": "desc"},
        include={"worker": True, "department": True},
    )


async def get_student_completed_balance(worker_id: str) -> float:
    payments = await db.payment.find_many(
        where={"workerId": worker_id, "status": "COMPLETED"}
    )
    return sum(float(p.amount or 0) for p in payments)
