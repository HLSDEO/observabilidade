from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Any, Dict
from uuid import UUID


class DashboardCreate(BaseModel):
    name: str
    description: Optional[str] = None
    config: Dict[str, Any]


class DashboardUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    config: Optional[Dict[str, Any]] = None


class DashboardResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    config: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
