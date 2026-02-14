from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.models.activity import Activity
from app.schemas.activity import ActivityRead

router = APIRouter()


@router.get("/task/{task_id}", response_model=list[ActivityRead])
async def list_task_activities(task_id: uuid.UUID, db: AsyncSession = Depends(get_db), limit: int = 50, offset: int = 0):
    result = await db.execute(
        select(Activity)
        .where(Activity.task_id == task_id)
        .order_by(Activity.activity_seq, Activity.created_at, Activity.id)
        .limit(limit)
        .offset(offset)
    )
    return result.scalars().all()
