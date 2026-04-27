from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException

from app.auth.authorization import ensure_supervisor_owns_worker
from app.auth.dependencies import require_role
from app.schemas.auth import CurrentUser
from app.schemas.payroll import PayrollGenerate, PayStubResponse, PayStubStatusUpdate
from app.services import payroll_service

router = APIRouter(prefix="/payroll", tags=["Payroll"])


@router.post("/generate", status_code=201, response_model=PayStubResponse)
async def generate_paystub(
    body: PayrollGenerate,
    current_user: Annotated[CurrentUser, Depends(require_role("SUPERVISOR", "ADMIN"))],
):
    """Supervisor generates a pay stub for a worker in their department. Admin can generate for any worker."""
    if current_user.role == "SUPERVISOR":
        await ensure_supervisor_owns_worker(current_user.profile_id, body.worker_id)
    return await payroll_service.generate_paystub(body, supervisor_id=current_user.profile_id)


@router.get("/my", response_model=list[PayStubResponse])
async def my_paystubs(
    current_user: Annotated[CurrentUser, Depends(require_role("WORKER"))],
):
    """Worker views their own pay stubs."""
    return await payroll_service.list_paystubs_for_worker(worker_id=current_user.profile_id)


@router.get("/all", response_model=list[PayStubResponse])
async def all_paystubs(
    current_user: Annotated[CurrentUser, Depends(require_role("SUPERVISOR", "ADMIN"))],
    status: Optional[str] = None,
):
    """Supervisor/Admin views all pay stubs, optionally filtered by status."""
    return await payroll_service.list_all_paystubs(status)


@router.get("/worker/{worker_id}", response_model=list[PayStubResponse])
async def worker_paystubs(
    worker_id: str,
    current_user: Annotated[CurrentUser, Depends(require_role("SUPERVISOR", "ADMIN"))],
):
    """
    Supervisor views pay stubs for a worker in their department.
    Admin can view any worker's pay stubs.
    """
    if current_user.role == "SUPERVISOR":
        await ensure_supervisor_owns_worker(current_user.profile_id, worker_id)
    return await payroll_service.list_paystubs_for_worker(worker_id)


@router.put("/{paystub_id}/status", response_model=PayStubResponse)
async def update_status(
    paystub_id: str,
    body: PayStubStatusUpdate,
    current_user: Annotated[CurrentUser, Depends(require_role("SUPERVISOR", "ADMIN"))],
):
    """Supervisor/Admin advances a pay stub through GENERATED → APPROVED → PAID."""
    return await payroll_service.update_status(
        paystub_id, body, supervisor_id=current_user.profile_id
    )


@router.get("/{paystub_id}", response_model=PayStubResponse)
async def get_paystub(
    paystub_id: str,
    current_user: Annotated[CurrentUser, Depends(require_role("WORKER", "SUPERVISOR", "ADMIN"))],
):
    """Fetch a single pay stub. Workers can only view their own."""
    paystub = await payroll_service.get_paystub(paystub_id)
    if current_user.role == "WORKER" and paystub.workerId != current_user.profile_id:
        raise HTTPException(status_code=403, detail="Access denied")
    return paystub
