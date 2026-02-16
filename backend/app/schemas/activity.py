from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel

ActivityType = Literal["created", "updated", "moved", "commented", "bulk_updated", "deleted"]


class ActivityRead(BaseModel):
    id: uuid.UUID
    task_id: uuid.UUID
    type: ActivityType
    payload: dict[str, Any]
    actor: str
    activity_seq: int
    created_at: datetime

    class Config:
        from_attributes = True
