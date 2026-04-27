"""
Analytics service — aggregates existing data for the admin dashboard.
No schema migrations required. All queries read existing tables.
"""
from app.db import get_db
from app.core import usage as usage_tracker

db = get_db()


async def get_dashboard_summary() -> dict:
    """
    Single endpoint that aggregates everything an admin needs:
    - System-wide counts (admins, supervisors, workers, departments)
    - Multi-level admin breakdown
    - Per-department workforce stats
    - Payroll cost per department
    - Top 5 most-used API features
    """
    # ── System counts ──────────────────────────────────────────────────────────
    total_admins = await db.admin.count()
    total_supervisors = await db.supervisor.count()
    total_workers = await db.worker.count()
    active_workers = await db.worker.count(where={"status": "ACTIVE"})
    total_departments = await db.department.count()

    # ── Admin level breakdown ──────────────────────────────────────────────────
    all_admins = await db.admin.find_many(
        include={"user": {"include": {"adminInvite": True}}}
    )
    system_admin_count = sum(
        1 for a in all_admins if not (a.user and a.user.adminInvite)
    )

    # ── Per-department workforce stats ─────────────────────────────────────────
    departments = await db.department.find_many(order={"name": "asc"})
    dept_stats = []
    for dept in departments:
        sup_count = await db.supervisor.count(where={"departmentId": dept.id})
        worker_count = await db.worker.count(where={"departmentId": dept.id})
        active_count = await db.worker.count(where={"departmentId": dept.id, "status": "ACTIVE"})
        dept_stats.append({
            "id": dept.id,
            "name": dept.name,
            "supervisor_count": sup_count,
            "worker_count": worker_count,
            "active_worker_count": active_count,
            "student_count": worker_count,
        })

    # ── Payroll cost per department ────────────────────────────────────────────
    dept_payroll = await get_payroll_by_department()

    # ── Feature usage ──────────────────────────────────────────────────────────
    all_usage = usage_tracker.get_usage()
    top_features = dict(list(all_usage.items())[:5])

    return {
        "system": {
            "total_admins": total_admins,
            "total_supervisors": total_supervisors,
            "total_workers": total_workers,
            "active_workers": active_workers,
            "total_departments": total_departments,
            "admin_levels": {
                "system_admins": system_admin_count,
                "department_admins": total_admins - system_admin_count,
            },
        },
        "departments": dept_stats,
        "payroll_by_department": dept_payroll,
        "top_features": top_features,
    }


async def get_payroll_by_department() -> list[dict]:
    """
    Aggregate pay stub totals grouped by department.
    Returns total gross pay, net pay, and hours worked per department.
    """
    departments = await db.department.find_many(order={"name": "asc"})
    result = []

    for dept in departments:
        workers = await db.worker.find_many(where={"departmentId": dept.id})
        worker_ids = [w.id for w in workers]

        if not worker_ids:
            result.append({
                "department_id": dept.id,
                "department_name": dept.name,
                "total_gross_pay": 0.0,
                "total_net_pay": 0.0,
                "total_hours": 0.0,
                "paystub_count": 0,
            })
            continue

        paystubs = await db.paystub.find_many(
            where={"workerId": {"in": worker_ids}}
        )

        total_gross = round(sum(p.grossPay for p in paystubs if p.grossPay), 2)
        total_net = round(sum(p.netPay for p in paystubs if p.netPay), 2)
        total_hours = round(sum(p.totalHours for p in paystubs if p.totalHours), 2)

        result.append({
            "department_id": dept.id,
            "department_name": dept.name,
            "total_gross_pay": total_gross,
            "total_net_pay": total_net,
            "total_hours": total_hours,
            "paystub_count": len(paystubs),
        })

    return result
