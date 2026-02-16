from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.models.comment import Comment
from app.schemas.comment import CommentCreate, CommentRead
from app.services import activity_service

router = APIRouter()


@router.get("/task/{task_id}", response_model=list[CommentRead])
async def list_comments(task_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Comment).where(Comment.task_id == task_id).order_by(Comment.created_at.desc()))
    return result.scalars().all()


@router.post("/task/{task_id}", response_model=CommentRead, status_code=status.HTTP_201_CREATED)
async def create_comment(task_id: uuid.UUID, payload: CommentCreate, db: AsyncSession = Depends(get_db)):
    comment = Comment(task_id=task_id, **payload.model_dump())
    db.add(comment)
    await db.flush()

    # Log a "commented" activity
    await activity_service.log_activity(
        db,
        task_id=task_id,
        actor=payload.actor,
        type="commented",
        payload={"body": payload.body},
    )

    await db.commit()
    await db.refresh(comment)
    return comment
