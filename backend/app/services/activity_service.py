from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity import Activity


async def next_activity_seq(session: AsyncSession, task_id: uuid.UUID) -> int:
    result = await session.execute(
        select(func.coalesce(func.max(Activity.activity_seq), 0)).where(Activity.task_id == task_id)
    )
    return result.scalar_one() + 1


async def log_activity(
    session: AsyncSession,
    *,
    task_id: uuid.UUID,
    actor: str,
    type: str,
    payload: dict[str, Any],
) -> Activity:
    seq = await next_activity_seq(session, task_id)
    activity = Activity(
        task_id=task_id,
        actor=actor,
        type=type,
        payload=payload,
        activity_seq=seq,
    )
    session.add(activity)
    await session.flush()
    return activity
