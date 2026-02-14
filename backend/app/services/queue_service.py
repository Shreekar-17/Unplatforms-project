from __future__ import annotations

from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.task import Task


PRIORITY_WEIGHT = {
    "P0": 0,
    "P1": 1,
    "P2": 2,
    "P3": 3,
}


def priority_order_query(base_query: Select | None = None) -> Select:
    query = base_query if base_query is not None else select(Task)
    # Deterministic tie-breaking: priority weight, priority updated timestamp?, ordering_index, id
    return query.order_by(
        Task.priority,
        Task.ordering_index,
        Task.id,
    )


async def next_best_tasks(session: AsyncSession, limit: int = 20):
    query = priority_order_query(select(Task).where(Task.status.in_(["Ready", "In Progress"])))
    result = await session.execute(query.limit(limit))
    return result.scalars().all()
