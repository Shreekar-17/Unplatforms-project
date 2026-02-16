from __future__ import annotations

import uuid
from typing import Sequence

from sqlalchemy import func, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate


class VersionConflictError(Exception):
    pass


async def list_tasks(session: AsyncSession) -> Sequence[Task]:
    result = await session.execute(select(Task).order_by(Task.status, Task.ordering_index, Task.id))
    return result.scalars().all()


async def create_task(session: AsyncSession, payload: TaskCreate) -> Task:
    # Auto-assign ordering_index at end of column if not explicitly set or is default
    if payload.ordering_index == 0.0:
        result = await session.execute(
            select(func.coalesce(func.max(Task.ordering_index), 0.0)).where(
                Task.status == payload.status
            )
        )
        max_index = result.scalar_one()
        payload_dict = payload.model_dump()
        payload_dict["ordering_index"] = max_index + 1000.0
    else:
        payload_dict = payload.model_dump()
    task = Task(**payload_dict)
    session.add(task)
    await session.flush()
    return task


async def update_task(session: AsyncSession, task_id: uuid.UUID, payload: TaskUpdate) -> Task:
    result = await session.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one()

    if payload.if_match != task.version:
        raise VersionConflictError("stale version")

    for field, value in payload.model_dump(exclude_none=True, exclude={"if_match"}).items():
        setattr(task, field, value)
    task.bump_version()
    await session.flush()
    return task


async def reorder_task(
    session: AsyncSession,
    task_id: uuid.UUID,
    *,
    new_status: str | None,
    new_ordering_index: float,
    if_match: int,
) -> Task:
    result = await session.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one()
    if if_match != task.version:
        raise VersionConflictError("stale version")

    if new_status is not None:
        task.status = new_status  # type: ignore[arg-type]
    task.ordering_index = new_ordering_index
    task.bump_version()
    await session.flush()
    return task
