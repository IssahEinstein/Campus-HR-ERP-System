from fastapi import HTTPException

from app.db import get_db
from app.schemas.shiftswap import ShiftSwapCreate, ShiftSwapReview
from app.services import shift_service


db = get_db()


async def submit_swap_request(data: ShiftSwapCreate, worker_id: str):
    """Worker submits a shift swap request targeting another worker."""
    # Verify the initiating worker exists
    worker = await db.worker.find_unique(where={"id": worker_id})
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    # Verify the from-assignment belongs to this worker
    from_assignment = await db.shiftassignment.find_unique(where={"id": data.from_assignment_id})
    if not from_assignment:
        raise HTTPException(status_code=404, detail="From-assignment not found")
    if from_assignment.workerId != worker_id:
        raise HTTPException(status_code=403, detail="from_assignment does not belong to you")

    # Verify target worker exists
    target = await db.worker.find_unique(where={"id": data.target_worker_id})
    if not target:
        raise HTTPException(status_code=404, detail="Target worker not found")

    # No self-swaps
    if data.target_worker_id == worker_id:
        raise HTTPException(status_code=400, detail="Cannot swap with yourself")

    # Check for duplicate pending request
    existing = await db.shiftswaprequest.find_first(
        where={
            "initiatedById": worker_id,
            "fromAssignmentId": data.from_assignment_id,
            "status": "PENDING",
        }
    )
    if existing:
        raise HTTPException(status_code=409, detail="A pending swap request already exists for this assignment")

    return await db.shiftswaprequest.create(
        data={
            "initiatedById": worker_id,
            "targetWorkerId": data.target_worker_id,
            "fromAssignmentId": data.from_assignment_id,
            "toAssignmentId": data.to_assignment_id,
            "reason": data.reason,
            "preferredPermanent": data.preferred_permanent,
        }
    )


async def cancel_swap_request(request_id: str, worker_id: str):
    """Initiating worker cancels their own pending swap request."""
    req = await db.shiftswaprequest.find_unique(where={"id": request_id})
    if not req:
        raise HTTPException(status_code=404, detail="Swap request not found")
    if req.initiatedById != worker_id:
        raise HTTPException(status_code=403, detail="This request does not belong to you")
    if req.status != "PENDING":
        raise HTTPException(status_code=409, detail="Only PENDING requests can be cancelled")

    return await db.shiftswaprequest.update(
        where={"id": request_id},
        data={"status": "CANCELLED"},
    )


async def review_swap_request(request_id: str, data: ShiftSwapReview, supervisor_id: str):
    """Supervisor approves or rejects a swap request."""
    if data.status not in ("APPROVED", "REJECTED"):
        raise HTTPException(status_code=422, detail="status must be APPROVED or REJECTED")

    req = await db.shiftswaprequest.find_unique(where={"id": request_id})
    if not req:
        raise HTTPException(status_code=404, detail="Swap request not found")
    if req.status != "PENDING":
        raise HTTPException(status_code=409, detail="Only PENDING requests can be reviewed")

    if data.status == "APPROVED":
        from_assignment = await _get_assignment_or_404(req.fromAssignmentId, "From-assignment")
        if from_assignment.workerId != req.initiatedById:
            raise HTTPException(status_code=409, detail="from_assignment no longer belongs to initiator")

        from_shift = await _get_shift_or_404(from_assignment.shiftId)

        if data.apply_permanently:
            if not from_shift.recurrenceGroupId:
                raise HTTPException(
                    status_code=409,
                    detail="Permanent swap is only supported for recurring shifts",
                )
            if req.toAssignmentId:
                to_assignment = await _get_assignment_or_404(req.toAssignmentId, "To-assignment")
                if to_assignment.workerId != req.targetWorkerId:
                    raise HTTPException(status_code=409, detail="to_assignment no longer belongs to target worker")

                to_shift = await _get_shift_or_404(to_assignment.shiftId)
                if not to_shift.recurrenceGroupId:
                    raise HTTPException(
                        status_code=409,
                        detail="Permanent two-way swap requires both assignments to be recurring",
                    )

                from_future_assignments = await _list_future_assignments_in_group(
                    worker_id=req.initiatedById,
                    recurrence_group_id=from_shift.recurrenceGroupId,
                    start_time=from_shift.startTime,
                )
                to_future_assignments = await _list_future_assignments_in_group(
                    worker_id=req.targetWorkerId,
                    recurrence_group_id=to_shift.recurrenceGroupId,
                    start_time=to_shift.startTime,
                )

                if not from_future_assignments or not to_future_assignments:
                    raise HTTPException(
                        status_code=409,
                        detail="No future recurring assignments found for permanent two-way swap",
                    )

                from_future_shift_ids = {a.shift.id for a in from_future_assignments}
                to_future_shift_ids = {a.shift.id for a in to_future_assignments}
                if from_future_shift_ids.intersection(to_future_shift_ids):
                    raise HTTPException(
                        status_code=409,
                        detail="Permanent two-way swap is not supported when recurring series share the same shift instances",
                    )

                for assignment in from_future_assignments:
                    existing_target_assignment = await db.shiftassignment.find_first(
                        where={
                            "shiftId": assignment.shift.id,
                            "workerId": req.targetWorkerId,
                        }
                    )
                    if existing_target_assignment:
                        raise HTTPException(
                            status_code=409,
                            detail="Target worker is already assigned to one of initiator's recurring shifts",
                        )
                    await shift_service.validate_worker_for_shift(
                        req.targetWorkerId,
                        assignment.shift.startTime,
                        assignment.shift.endTime,
                        exclude_shift_ids={assignment.shift.id}.union(to_future_shift_ids),
                    )

                for assignment in to_future_assignments:
                    existing_initiator_assignment = await db.shiftassignment.find_first(
                        where={
                            "shiftId": assignment.shift.id,
                            "workerId": req.initiatedById,
                        }
                    )
                    if existing_initiator_assignment:
                        raise HTTPException(
                            status_code=409,
                            detail="Initiator is already assigned to one of target's recurring shifts",
                        )
                    await shift_service.validate_worker_for_shift(
                        req.initiatedById,
                        assignment.shift.startTime,
                        assignment.shift.endTime,
                        exclude_shift_ids={assignment.shift.id}.union(from_future_shift_ids),
                    )

                for assignment in from_future_assignments:
                    await db.shiftassignment.update(
                        where={"id": assignment.id},
                        data={"workerId": req.targetWorkerId, "assignedById": supervisor_id},
                    )
                for assignment in to_future_assignments:
                    await db.shiftassignment.update(
                        where={"id": assignment.id},
                        data={"workerId": req.initiatedById, "assignedById": supervisor_id},
                    )
            else:
                future_assignments = await _list_future_assignments_in_group(
                    worker_id=req.initiatedById,
                    recurrence_group_id=from_shift.recurrenceGroupId,
                    start_time=from_shift.startTime,
                )
                if not future_assignments:
                    raise HTTPException(
                        status_code=409,
                        detail="No future recurring assignments found for permanent swap",
                    )

                for assignment in future_assignments:
                    existing_target_assignment = await db.shiftassignment.find_first(
                        where={
                            "shiftId": assignment.shift.id,
                            "workerId": req.targetWorkerId,
                        }
                    )
                    if existing_target_assignment:
                        raise HTTPException(
                            status_code=409,
                            detail="Target worker is already assigned to one of the future recurring shifts",
                        )

                    await shift_service.validate_worker_for_shift(
                        req.targetWorkerId,
                        assignment.shift.startTime,
                        assignment.shift.endTime,
                        exclude_shift_ids={assignment.shift.id},
                    )

                for assignment in future_assignments:
                    await db.shiftassignment.update(
                        where={"id": assignment.id},
                        data={"workerId": req.targetWorkerId, "assignedById": supervisor_id},
                    )
        elif req.toAssignmentId:
            to_assignment = await _get_assignment_or_404(req.toAssignmentId, "To-assignment")
            if to_assignment.workerId != req.targetWorkerId:
                raise HTTPException(status_code=409, detail="to_assignment no longer belongs to target worker")

            to_shift = await _get_shift_or_404(to_assignment.shiftId)

            await shift_service.validate_worker_for_shift(
                req.targetWorkerId,
                from_shift.startTime,
                from_shift.endTime,
                exclude_shift_ids={from_shift.id, to_shift.id},
            )
            await shift_service.validate_worker_for_shift(
                req.initiatedById,
                to_shift.startTime,
                to_shift.endTime,
                exclude_shift_ids={from_shift.id, to_shift.id},
            )

            await db.shiftassignment.update(
                where={"id": from_assignment.id},
                data={"workerId": req.targetWorkerId, "assignedById": supervisor_id},
            )
            await db.shiftassignment.update(
                where={"id": to_assignment.id},
                data={"workerId": req.initiatedById, "assignedById": supervisor_id},
            )
        else:
            existing_target_assignment = await db.shiftassignment.find_first(
                where={"shiftId": from_assignment.shiftId, "workerId": req.targetWorkerId}
            )
            if existing_target_assignment:
                raise HTTPException(status_code=409, detail="Target worker is already assigned to this shift")

            await shift_service.validate_worker_for_shift(
                req.targetWorkerId,
                from_shift.startTime,
                from_shift.endTime,
                exclude_shift_ids={from_shift.id},
            )

            await db.shiftassignment.update(
                where={"id": from_assignment.id},
                data={"workerId": req.targetWorkerId, "assignedById": supervisor_id},
            )

    return await db.shiftswaprequest.update(
        where={"id": request_id},
        data={
            "status": data.status,
            "reviewedById": supervisor_id,
            "approvalNotes": data.approval_notes,
        },
    )


async def _get_assignment_or_404(assignment_id: str | None, label: str):
    if not assignment_id:
        raise HTTPException(status_code=404, detail=f"{label} not found")
    assignment = await db.shiftassignment.find_unique(where={"id": assignment_id})
    if not assignment:
        raise HTTPException(status_code=404, detail=f"{label} not found")
    if assignment.status != "ASSIGNED":
        raise HTTPException(status_code=409, detail=f"{label} is not in ASSIGNED status")
    return assignment


async def _get_shift_or_404(shift_id: str):
    shift = await db.shift.find_unique(where={"id": shift_id})
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    if shift.status != "SCHEDULED":
        raise HTTPException(status_code=409, detail="Swap can only apply to scheduled shifts")
    return shift


async def _list_future_assignments_in_group(
    worker_id: str,
    recurrence_group_id: str,
    start_time,
):
    return await db.shiftassignment.find_many(
        where={
            "workerId": worker_id,
            "status": "ASSIGNED",
            "shift": {
                "recurrenceGroupId": recurrence_group_id,
                "startTime": {"gte": start_time},
                "status": "SCHEDULED",
            },
        },
        include={"shift": True},
        order={"shift": {"startTime": "asc"}},
    )


async def get_swap_request(request_id: str):
    """Fetch a single swap request."""
    req = await db.shiftswaprequest.find_unique(where={"id": request_id})
    if not req:
        raise HTTPException(status_code=404, detail="Swap request not found")
    return req


async def list_swap_requests_for_worker(worker_id: str):
    """List all swap requests where the worker is initiator or target."""
    return await db.shiftswaprequest.find_many(
        where={
            "OR": [
                {"initiatedById": worker_id},
                {"targetWorkerId": worker_id},
            ]
        },
        order={"createdAt": "desc"},
    )


async def list_pending_swaps():
    """Supervisor view — all pending swap requests."""
    return await db.shiftswaprequest.find_many(
        where={"status": "PENDING"},
        order={"createdAt": "asc"},
    )
