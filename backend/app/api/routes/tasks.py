from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.deps import get_current_user
from app.models.task import Task
from app.models.user import User
from app.schemas.task import TaskCreate, TaskRead, TaskUpdate, ReorderRequest, BulkUpdateRequest, BulkUpdateResponse
from app.services import activity_service, task_service

router = APIRouter()


@router.get("/", response_model=list[TaskRead])
async def list_tasks(
    sort: str = "manual",
    db: AsyncSession = Depends(get_db)
):
    tasks = await task_service.list_tasks(db, sort=sort)
    return tasks


@router.post("/", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
async def create_task(
    payload: TaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = await task_service.create_task(db, payload)
    await activity_service.log_activity(
        db,
        task_id=task.id,
        actor=current_user.username,
        type="created",
        payload={"title": task.title},
    )
    await db.commit()
    await db.refresh(task)
    return task


@router.patch("/{task_id}", response_model=TaskRead)
async def update_task(
    task_id: uuid.UUID,
    payload: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Grab old state for activity diff
    old_task = await db.execute(
        select(Task).where(Task.id == task_id)
    )
    old_task_obj = old_task.scalar_one()
    old_status = old_task_obj.status
    old_priority = old_task_obj.priority
    old_owner = old_task_obj.owner

    try:
        task = await task_service.update_task(db, task_id, payload)
    except task_service.VersionConflictError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="stale version")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    # Build rich payload with old → new values
    changes = payload.model_dump(exclude_none=True, exclude={"if_match"})
    activity_payload: dict = {}

    if "status" in changes and changes["status"] != old_status:
        activity_payload["old_status"] = old_status
        activity_payload["new_status"] = changes["status"]
    if "priority" in changes and changes["priority"] != old_priority:
        activity_payload["old_priority"] = old_priority
        activity_payload["new_priority"] = changes["priority"]
    if "owner" in changes:
        activity_payload["old_owner"] = old_owner
        activity_payload["new_owner"] = changes["owner"]
    if "title" in changes:
        activity_payload["title"] = changes["title"]
    if "description" in changes:
        activity_payload["description"] = True
    if "estimate" in changes:
        activity_payload["estimate"] = changes["estimate"]

    if activity_payload:
        await activity_service.log_activity(
            db,
            task_id=task.id,
            actor=current_user.username,
            type="updated",
            payload=activity_payload,
        )

    await db.commit()
    await db.refresh(task)
    return task


@router.post("/{task_id}/reorder", response_model=TaskRead)
async def reorder_task(
    task_id: uuid.UUID,
    body: ReorderRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Capture old status before reorder
    old_result = await db.execute(
        select(Task).where(Task.id == task_id)
    )
    old_task = old_result.scalar_one()
    old_status = old_task.status

    try:
        task = await task_service.reorder_task(
            db,
            task_id,
            new_status=body.new_status,
            new_ordering_index=body.new_ordering_index,
            if_match=body.if_match,
        )
    except task_service.VersionConflictError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="stale version")

    # Only log a move activity if status actually changed
    if body.new_status is not None and body.new_status != old_status:
        await activity_service.log_activity(
            db,
            task_id=task.id,
            actor=current_user.username,
            type="moved",
            payload={"old_status": old_status, "new_status": body.new_status},
        )

    await db.commit()
    await db.refresh(task)
    return task


@router.post("/bulk", response_model=BulkUpdateResponse)
async def bulk_update_tasks(
    body: BulkUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not body.task_ids:
        return {"updated": [], "failed": []}

    # Fetch all requested tasks
    result = await db.execute(select(Task).where(Task.id.in_(body.task_ids)))
    tasks = list(result.scalars().all())

    if not tasks:
        # If no tasks found, all requested IDs are technically "failed" (not found)
        # But for simplicity, we can just return empty lists or error if strict.
        # Let's return empty to be safe, or raise 404 if partial success isn't possible.
        # Given "granular feedback", returning empty lists is safer than 404ing the whole batch.
        return {"updated": [], "failed": [{"task_id": tid, "error": "Not found"} for tid in body.task_ids]}

    updated_tasks = []
    failed_items = []

    # Map for easy lookup
    tasks_map = {t.id: t for t in tasks}

    # Iterate through requested IDs to handle missing ones too
    for task_id in body.task_ids:
        task = tasks_map.get(task_id)
        if not task:
            failed_items.append({"task_id": task_id, "error": "Not found"})
            continue

        # Check version if provided
        expected_version = body.versions.get(task_id)
        if expected_version is not None and task.version != expected_version:
            failed_items.append({"task_id": task_id, "error": "Conflict: Task has been modified by someone else"})
            continue

        if body.delete:
            await activity_service.log_activity(
                db,
                task_id=task.id,
                actor=current_user.username,
                type="deleted",
                payload={"title": task.title},
            )
            await db.delete(task)
            # For delete, we don't add to updated_tasks list usually, or we return the deleted object
            # But the response model expects TaskRead. 
            # If deleted, we can't return it easily as "updated".
            # Let's assume bulk delete returns the deleted objects (before deletion state).
            updated_tasks.append(task)
            continue

        # Apply updates
        changes: dict = {}
        if body.status is not None and body.status != task.status:
            changes["old_status"] = task.status
            changes["new_status"] = body.status
            task.status = body.status
        if body.priority is not None and body.priority != task.priority:
            changes["old_priority"] = task.priority
            changes["new_priority"] = body.priority
            task.priority = body.priority
        if body.owner is not None:
            changes["old_owner"] = task.owner
            changes["new_owner"] = body.owner
            task.owner = body.owner

        if changes:
            task.bump_version()
            await activity_service.log_activity(
                db,
                task_id=task.id,
                actor=current_user.username,
                type="bulk_updated",
                payload=changes,
            )
        updated_tasks.append(task)

    await db.commit()
    
    # Refresh updated tasks (skip deleted ones)
    if not body.delete:
        for task in updated_tasks:
            await db.refresh(task)

    return {"updated": updated_tasks, "failed": failed_items}


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    await activity_service.log_activity(
        db,
        task_id=task.id,
        actor=current_user.username,
        type="deleted",
        payload={"title": task.title},
    )
    await db.delete(task)
    await db.commit()

