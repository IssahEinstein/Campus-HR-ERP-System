from fastapi import APIRouter, Depends
from typing import List, Optional

from app.schemas.payroll import PayrollGenerate, PayStubStatusUpdate, PayStubResponse
from app.services import payroll_service
from app.utils.dependencies import require_supervisor, require_worker, require_any_role

router = APIRouter(prefix="/payroll", tags=["Payroll"])


@router.post("", response_model=PayStubResponse, status_code=201)
async def generate_paystub(
    data: PayrollGenerate,
    current_user: dict = Depends(require_supervisor),
):
    """Supervisor generates a pay stub for a worker based on attendance hours."""
    return await payroll_service.generate_paystub(data, supervisor_id=current_user["user_id"])


@router.patch("/{paystub_id}/status", response_model=PayStubResponse)
async def update_status(
    paystub_id: str,
    data: PayStubStatusUpdate,
    current_user: dict = Depends(require_supervisor),
):
    """Supervisor advances pay stub status: GENERATED → APPROVED → PAID."""
    return await payroll_service.update_status(
        paystub_id, data, supervisor_id=current_user["user_id"]
    )


@router.get("", response_model=List[PayStubResponse])
async def list_all_paystubs(
    status: Optional[str] = None,
    current_user: dict = Depends(require_supervisor),
):
    """Supervisor lists all pay stubs, optionally filtered by status."""
    return await payroll_service.list_all_paystubs(status=status)


@router.get("/me", response_model=List[PayStubResponse])
async def my_paystubs(
    current_user: dict = Depends(require_worker),
):
    """Worker views their own pay stubs."""
    return await payroll_service.list_paystubs_for_worker(worker_id=current_user["user_id"])


@router.get("/worker/{worker_id}", response_model=List[PayStubResponse])
async def paystubs_for_worker(
    worker_id: str,
    current_user: dict = Depends(require_supervisor),
):
    """Supervisor views all pay stubs for a specific worker."""
    return await payroll_service.list_paystubs_for_worker(worker_id)


@router.get("/{paystub_id}", response_model=PayStubResponse)
async def get_paystub(
    paystub_id: str,
    current_user: dict = Depends(require_any_role),
):
    """Get a single pay stub by ID."""
    return await payroll_service.get_paystub(paystub_id)
