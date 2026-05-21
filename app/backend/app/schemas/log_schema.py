from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID


class LogCreate(BaseModel):
    start: datetime
    end: datetime
    source: str
    type: str
    identifier: str
    data: str
    location: Optional[str] = None
    environment: str
    status_code: Optional[str] = None
    identifier_2: Optional[str] = None
    identifier_3: Optional[str] = None


class LogResponse(BaseModel):
    id: UUID
    start_time: datetime
    end_time: datetime
    source: str
    type: str
    identifier: str
    data: str
    location: Optional[str]
    environment: str
    status_code: Optional[str]
    identifier_2: Optional[str]
    identifier_3: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
