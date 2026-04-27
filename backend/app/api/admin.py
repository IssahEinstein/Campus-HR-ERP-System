from typing import Annotated

from fastapi import APIRouter, Depends, Header

from app.auth.dependencies import require_role
from app.db import get_db
from app.schemas.auth import CurrentUser
from app.schemas.common import (
    BootstrapResponse,
    MessageResponse,
    SemesterSettingsResponse,
    SemesterSettingsUpdate,
)
from app.schemas.invite import (
    BootstrapAdminRequest,
    DepartmentCreate,
    DepartmentUpdate,
    InviteAdminRequest,
    InviteSupervisorRequest,
)
from app.schemas.profiles import AdminResponse, DashboardSummaryResponse, DepartmentResponse, DepartmentStatsResponse, DeptPayrollResponse, SupervisorResponse, SystemStatsResponse, SystemUsageResponse, WorkerResponse
from app.services import admin_service, department_service, invite_service, analytics_service
from app.core import usage as usage_tracker
import csv
import io
from fastapi.responses import StreamingResponse

router = APIRouter(prefix="/admin", tags=["Admin"])
_db = get_db()


@router.post("/bootstrap", status_code=201, response_model=BootstrapResponse)
async def bootstrap_admin(
    body: BootstrapAdminRequest,
    x_admin_bootstrap_key: str | None = Header(default=None),
):
    """
    One-time endpoint to create the first ADMIN account.
    Disabled automatically after an admin already exists.
    """
    return await admin_service.bootstrap_admin(body, provided_key=x_admin_bootstrap_key)


@router.post("/invite-supervisor", status_code=201, response_model=MessageResponse)
async def invite_supervisor(
    body: InviteSupervisorRequest,
    current_user: Annotated[CurrentUser, Depends(require_role("ADMIN"))],
):
    """Admin invites a new supervisor — an email with a setup link is sent."""
    return await invite_service.invite_supervisor(body, admin_id=current_user.profile_id)


@router.post("/invite-admin", status_code=201, response_model=MessageResponse)
async def invite_admin(
    body: InviteAdminRequest,
    current_user: Annotated[CurrentUser, Depends(require_role("ADMIN"))],
):
    """Admin invites another admin (peer-level) with an activation email."""
    return await invite_service.invite_admin(body, inviter_admin_id=current_user.profile_id)


@router.post("/admins/{admin_profile_id}/resend-invite", response_model=MessageResponse)
async def resend_admin_invite(
    admin_profile_id: str,
    current_user: Annotated[CurrentUser, Depends(require_role("ADMIN"))],
):
    """Inviting admin can resend invite email to a not-yet-activated admin."""
    return await invite_service.resend_admin_invite(
        admin_profile_id=admin_profile_id,
        requester_admin_id=current_user.profile_id,
    )


@router.post("/supervisors/{supervisor_id}/resend-invite", response_model=MessageResponse)
async def resend_supervisor_invite(
    supervisor_id: str,
    current_user: Annotated[CurrentUser, Depends(require_role("ADMIN"))],
):
    """Admin resends invite email to a not-yet-activated supervisor."""
    return await invite_service.resend_supervisor_invite(
        supervisor_id=supervisor_id,
        admin_id=current_user.profile_id,
    )


@router.get("/supervisors", response_model=list[SupervisorResponse])
async def list_supervisors(
    current_user: Annotated[CurrentUser, Depends(require_role("ADMIN"))],
):
    """Admin views all supervisors across the system."""
    supervisors = await _db.supervisor.find_many(
        include={"user": {"include": {"supervisorInvite": True}}, "department": True},
        order={"createdAt": "desc"},
    )

    return [
        {
            "id": supervisor.id,
            "supervisor_id": supervisor.supervisorId,
            "user_id": supervisor.userId,
            "department_id": supervisor.departmentId,
            "created_at": supervisor.createdAt,
            "invite_pending": bool(
                supervisor.user
                and supervisor.user.supervisorInvite
                and supervisor.user.supervisorInvite.usedAt is None
            ),
            "user": supervisor.user,
            "department": supervisor.department,
        }
        for supervisor in supervisors
    ]


@router.get("/admins", response_model=list[AdminResponse])
async def list_admins(
    current_user: Annotated[CurrentUser, Depends(require_role("ADMIN"))],
):
    """Admin views all admins across the system."""
    admins = await _db.admin.find_many(
        include={"user": {"include": {"adminInvite": True}}},
        order={"createdAt": "desc"},
    )

    return [
        {
            "id": admin.id,
            "admin_id": admin.adminId,
            "user_id": admin.userId,
            "created_at": admin.createdAt,
            "is_active": bool(admin.user and admin.user.isActive),
            "invite_pending": bool(
                admin.user
                and admin.user.adminInvite
                and admin.user.adminInvite.usedAt is None
            ),
            "is_system_admin": bool(
                not (admin.user and admin.user.adminInvite)
            ),
            "user": admin.user,
        }
        for admin in admins
    ]


@router.patch("/admins/{admin_profile_id}/deactivate", response_model=MessageResponse)
async def deactivate_admin(
    admin_profile_id: str,
    current_user: Annotated[CurrentUser, Depends(require_role("ADMIN"))],
):
    """Admin deactivates another admin account."""
    return await admin_service.set_admin_active_state(
        admin_profile_id=admin_profile_id,
        is_active=False,
        acting_admin_profile_id=current_user.profile_id,
    )


@router.patch("/admins/{admin_profile_id}/activate", response_model=MessageResponse)
async def activate_admin(
    admin_profile_id: str,
    current_user: Annotated[CurrentUser, Depends(require_role("ADMIN"))],
):
    """Admin reactivates another admin account."""
    return await admin_service.set_admin_active_state(
        admin_profile_id=admin_profile_id,
        is_active=True,
        acting_admin_profile_id=current_user.profile_id,
    )


@router.delete("/admins/{admin_profile_id}", response_model=MessageResponse)
async def delete_admin(
    admin_profile_id: str,
    current_user: Annotated[CurrentUser, Depends(require_role("ADMIN"))],
):
    """Admin deletes another admin account."""
    return await admin_service.delete_admin(
        admin_profile_id=admin_profile_id,
        acting_admin_profile_id=current_user.profile_id,
    )


@router.get("/workers", response_model=list[WorkerResponse])
async def list_all_workers(
    current_user: Annotated[CurrentUser, Depends(require_role("ADMIN"))],
):
    """Admin views all workers across the system."""
    return await _db.worker.find_many(
        include={"user": True, "department": True},
        order={"createdAt": "desc"},
    )


@router.post("/departments", status_code=201, response_model=DepartmentResponse)
async def create_department(
    body: DepartmentCreate,
    current_user: Annotated[CurrentUser, Depends(require_role("ADMIN"))],
):
    """Admin creates a new department."""
    return await department_service.create_department(
        body.name,
        admin_id=current_user.profile_id,
        budget_allocated=body.budget_allocated or 0,
        budget_spent=body.budget_spent or 0,
    )


@router.get("/departments", response_model=list[DepartmentResponse])
async def list_departments(
    current_user: Annotated[CurrentUser, Depends(require_role("ADMIN"))],
):
    """Admin lists all departments."""
    return await department_service.list_departments()


@router.patch("/departments/{department_id}", response_model=DepartmentResponse)
async def rename_department(
    department_id: str,
    body: DepartmentUpdate,
    current_user: Annotated[CurrentUser, Depends(require_role("ADMIN"))],
):
    """Admin updates department name and/or budget fields."""
    return await department_service.update_department(
        department_id,
        name=body.name,
        budget_allocated=body.budget_allocated,
        budget_spent=body.budget_spent,
    )


@router.delete("/departments/{department_id}", response_model=MessageResponse)
async def delete_department(
    department_id: str,
    current_user: Annotated[CurrentUser, Depends(require_role("ADMIN"))],
):
    """Admin deletes an empty department."""
    return await department_service.delete_department(department_id)


@router.delete("/supervisors/{supervisor_id}", response_model=MessageResponse)
async def delete_supervisor(
    supervisor_id: str,
    current_user: Annotated[CurrentUser, Depends(require_role("ADMIN"))],
):
    """Admin deletes a supervisor account."""
    return await admin_service.delete_supervisor(supervisor_id)


@router.get("/semester-settings", response_model=SemesterSettingsResponse)
async def get_semester_settings(
    current_user: Annotated[CurrentUser, Depends(require_role("ADMIN"))],
):
    """Admin reads semester start/end dates used by recurring shifts."""
    return await admin_service.get_semester_settings()


# ── Department analytics ────────────────────────────────────────────────────

@router.get("/departments/stats", response_model=list[DepartmentStatsResponse])
async def list_department_stats(
    current_user: Annotated[CurrentUser, Depends(require_role("ADMIN"))],
):
    """Return workforce size, supervisor count, and student count for every department."""
    return await department_service.get_all_department_stats()


@router.get("/departments/{department_id}/stats", response_model=DepartmentStatsResponse)
async def get_department_stats(
    department_id: str,
    current_user: Annotated[CurrentUser, Depends(require_role("ADMIN"))],
):
    """Return workforce metrics for a single department."""
    return await department_service.get_department_stats(department_id)


# ── System-level overview ───────────────────────────────────────────────────

@router.get("/system/stats", response_model=SystemStatsResponse)
async def get_system_stats(
    current_user: Annotated[CurrentUser, Depends(require_role("ADMIN"))],
):
    """
    System-wide operational overview: total admins (system vs department level),
    supervisors, workers, and departments.
    """
    return await admin_service.get_system_stats()


@router.get("/system/usage", response_model=SystemUsageResponse)
async def get_system_usage(
    current_user: Annotated[CurrentUser, Depends(require_role("ADMIN"))],
):
    """Return most-used API endpoints since server start — identifies active features."""
    snapshot = usage_tracker.get_usage()
    top = next(iter(snapshot), None)
    return {"usage": snapshot, "top_feature": top}


# ── Dashboard analytics ────────────────────────────────────────────────────────

@router.get("/dashboard", response_model=DashboardSummaryResponse)
async def get_dashboard(
    current_user: Annotated[CurrentUser, Depends(require_role("ADMIN"))],
):
    """
    Unified admin dashboard — system stats, per-department workforce,
    payroll cost by department, and top 5 most-used API features.
    """
    return await analytics_service.get_dashboard_summary()


# ── Payroll by department ──────────────────────────────────────────────────────

@router.get("/payroll/by-department", response_model=list[DeptPayrollResponse])
async def get_payroll_by_department(
    current_user: Annotated[CurrentUser, Depends(require_role("ADMIN"))],
):
    """Total gross pay, net pay, and hours worked grouped by department."""
    return await analytics_service.get_payroll_by_department()


# ── CSV export ─────────────────────────────────────────────────────────────────

@router.get("/departments/export", response_class=StreamingResponse)
async def export_departments_csv(
    current_user: Annotated[CurrentUser, Depends(require_role("ADMIN"))],
):
    """Download a CSV report of all departments with workforce and payroll data."""
    dept_stats = await department_service.get_all_department_stats()
    dept_payroll = await analytics_service.get_payroll_by_department()

    payroll_map = {d["department_id"]: d for d in dept_payroll}

    output = io.StringIO()
    writer = csv.DictWriter(
        output,
        fieldnames=[
            "Department", "Supervisors", "Total Workers", "Active Workers",
            "Students", "Budget Allocated ($)", "Budget Spent ($)", "Budget Remaining ($)",
            "Gross Pay ($)", "Net Pay ($)", "Total Hours", "Pay Stubs",
        ],
    )
    writer.writeheader()
    for dept in dept_stats:
        pr = payroll_map.get(dept["id"], {})
        writer.writerow({
            "Department": dept["name"],
            "Supervisors": dept["supervisor_count"],
            "Total Workers": dept["worker_count"],
            "Active Workers": dept["active_worker_count"],
            "Students": dept["student_count"],
            "Budget Allocated ($)": dept.get("budget_allocated", 0.0),
            "Budget Spent ($)": dept.get("budget_spent", 0.0),
            "Budget Remaining ($)": dept.get("budget_remaining", 0.0),
            "Gross Pay ($)": pr.get("total_gross_pay", 0.0),
            "Net Pay ($)": pr.get("total_net_pay", 0.0),
            "Total Hours": pr.get("total_hours", 0.0),
            "Pay Stubs": pr.get("paystub_count", 0),
        })

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=department_report.csv"},
    )


@router.put("/semester-settings", response_model=SemesterSettingsResponse)
async def update_semester_settings(
    body: SemesterSettingsUpdate,
    current_user: Annotated[CurrentUser, Depends(require_role("ADMIN"))],
):
    """Admin sets semester start/end dates used by recurring shifts."""
    return await admin_service.upsert_semester_settings(body)
