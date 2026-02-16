from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.deps import get_current_user
from app.models.task import Task
from app.models.user import User
from app.schemas.task import TaskCreate, TaskRead, TaskUpdate, ReorderRequest
from app.services import activity_service, task_service

router = APIRouter()


@router.get("/", response_model=list[TaskRead])
async def list_tasks(db: AsyncSession = Depends(get_db)):
    tasks = await task_service.list_tasks(db)
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
