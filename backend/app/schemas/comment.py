from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel


class CommentCreate(BaseModel):
    body: str
    actor: str


class CommentRead(CommentCreate):
    id: uuid.UUID
    task_id: uuid.UUID
    created_at: datetime
    version: int

    class Config:
        from_attributes = True
