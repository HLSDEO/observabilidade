from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID

class LogCreate(BaseModel):
    start: datetime
    end: datetime
    source: str
    type: str  # info, success, error, warning, danger
    identifier: str
    data: str
    location: str
    environment: str  # dev, hom, prod
    status_code: Optional[str] = None
    identifier_2: Optional[str] = None
    identifier_3: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "start": "2026-05-21T10:30:00Z",
                "end": "2026-05-21T10:30:05Z",
                "source": "robo-contratos",
                "type": "error",
                "identifier": "contrato-12345",
                "data": "Falha ao processar contrato de serviços gerais",
                "location": "ProcessadorContratos.processar()",
                "environment": "prod",
                "status_code": "500",
                "identifier_2": "municipio-3042",
                "identifier_3": "unidade-central"
            }
        }

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
