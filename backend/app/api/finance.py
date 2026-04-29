from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.auth.dependencies import require_role
from app.schemas.finance import PaymentRequest, PaymentResponse, PaymentSummaryResponse
from app.services.finance_service import list_payments, record_payment, get_student_completed_balance

router = APIRouter(prefix="/finance", tags=["Finance"])


@router.post("/students/{student_id}/payments", response_model=PaymentResponse)
async def create_student_payment(
    student_id: str,
    body: PaymentRequest,
    current_user: Annotated[object, Depends(require_role("WORKER", "SUPERVISOR", "ADMIN"))],
):
    if current_user.role == "WORKER" and current_user.user_id != student_id:
        raise HTTPException(status_code=403, detail="Workers may only submit payments for their own student account")

    payment = await record_payment(
        worker_id=student_id,
        amount=body.amount,
        payment_type=body.payment_type,
        description=body.description,
        semester=body.semester,
    )
    return payment


@router.get("/students/{student_id}/payments", response_model=list[PaymentResponse])
async def get_student_payments(
    student_id: str,
    current_user: Annotated[object, Depends(require_role("WORKER", "SUPERVISOR", "ADMIN"))],
):
    if current_user.role == "WORKER" and current_user.user_id != student_id:
        raise HTTPException(status_code=403, detail="Workers may only view payments for their own student account")

    return await list_payments(worker_id=student_id)


@router.get("/students/{student_id}/payment-summary", response_model=PaymentSummaryResponse)
async def get_student_payment_summary(
    student_id: str,
    current_user: Annotated[object, Depends(require_role("WORKER", "SUPERVISOR", "ADMIN"))],
):
    if current_user.role == "WORKER" and current_user.user_id != student_id:
        raise HTTPException(status_code=403, detail="Workers may only view payments for their own student account")

    total = await get_student_completed_balance(student_id)
    return PaymentSummaryResponse(worker_id=student_id, completed_amount=total)
