from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID

class DashboardCreate(BaseModel):
    name: str
    description: Optional[str] = None
    config: Dict[str, Any]

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Monitoramento de Contratos",
                "description": "Dashboard para acompanhar requisições com falha",
                "config": {
                    "id": "dashboard-1",
                    "refreshInterval": 30,
                    "cards": [
                        {
                            "id": "card-1",
                            "title": "Total de Erros por Município",
                            "type": "bar",
                            "query": {
                                "source": "robo-contratos",
                                "aggregation": "count",
                                "filters": {"type": "error"},
                                "groupBy": ["identifier_2"]
                            }
                        }
                    ]
                }
            }
        }

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
