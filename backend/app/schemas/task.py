from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional, Literal

from pydantic import BaseModel, Field

# Use Literal types instead of importing Enum classes
Priority = Literal["P0", "P1", "P2", "P3"]
Status = Literal["Backlog", "Ready", "In Progress", "Review", "Done"]


class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: Status = "Backlog"
    priority: Priority = "P2"
    owner: Optional[str] = None
    tags: dict = Field(default_factory=dict)
    estimate: Optional[int] = None
    ordering_index: float = 0.0


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[Status] = None
    priority: Optional[Priority] = None
    owner: Optional[str] = None
    tags: Optional[dict] = None
    estimate: Optional[int] = None
    ordering_index: Optional[float] = None
    if_match: int


class TaskRead(TaskBase):
    id: uuid.UUID
    version: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ReorderRequest(BaseModel):
    new_status: Optional[str] = None
    new_ordering_index: float
    if_match: int
