from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.models.activity import Activity
from app.models.task import Task
from app.schemas.activity import ActivityRead

router = APIRouter()


@router.get("/", response_model=list[ActivityRead])
async def list_all_activities(
    db: AsyncSession = Depends(get_db),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    type: str | None = Query(None, description="Filter by activity type"),
):
    """List all activities across all tasks, newest first."""
    stmt = select(Activity).order_by(Activity.created_at.desc())
    if type:
        stmt = stmt.where(Activity.type == type)
    stmt = stmt.limit(limit).offset(offset)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/task/{task_id}", response_model=list[ActivityRead])
async def list_task_activities(
    task_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    result = await db.execute(
        select(Activity)
        .where(Activity.task_id == task_id)
        .order_by(Activity.created_at.desc(), Activity.activity_seq.desc())
        .limit(limit)
        .offset(offset)
    )
    return result.scalars().all()
