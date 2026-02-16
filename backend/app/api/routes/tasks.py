from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskRead, TaskUpdate, ReorderRequest
from app.services import activity_service, task_service

router = APIRouter()


@router.get("/", response_model=list[TaskRead])
async def list_tasks(db: AsyncSession = Depends(get_db)):
    tasks = await task_service.list_tasks(db)
    return tasks


@router.post("/", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
async def create_task(payload: TaskCreate, db: AsyncSession = Depends(get_db)):
    task = await task_service.create_task(db, payload)
    await activity_service.log_activity(
        db,
        task_id=task.id,
        actor="system",
        type="created",
        payload={"title": task.title},
    )
    await db.commit()
    await db.refresh(task)
    return task


@router.patch("/{task_id}", response_model=TaskRead)
async def update_task(task_id: uuid.UUID, payload: TaskUpdate, db: AsyncSession = Depends(get_db)):
    try:
        task = await task_service.update_task(db, task_id, payload)
    except task_service.VersionConflictError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="stale version")

    await activity_service.log_activity(
        db,
        task_id=task.id,
        actor="system",
        type="updated",
        payload=payload.model_dump(exclude_none=True, exclude={"if_match"}),
    )
    await db.commit()
    await db.refresh(task)
    return task


@router.post("/{task_id}/reorder", response_model=TaskRead)
async def reorder_task(
    task_id: uuid.UUID,
    body: ReorderRequest,
    db: AsyncSession = Depends(get_db),
):
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

    await activity_service.log_activity(
        db,
        task_id=task.id,
        actor="system",
        type="moved",
        payload={"new_status": body.new_status, "ordering_index": body.new_ordering_index},
    )
    await db.commit()
    await db.refresh(task)
    return task
