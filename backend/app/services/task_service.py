from __future__ import annotations

import uuid
from typing import Sequence

from sqlalchemy import select, update
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
    task = Task(**payload.model_dump())
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
