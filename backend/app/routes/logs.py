from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.schemas import LogCreate, LogResponse
from app.models import Log

router = APIRouter(prefix="/logs", tags=["logs"])

@router.post("/", response_model=LogResponse, status_code=201)
def create_log(log: LogCreate, db: Session = Depends(get_db)):
    """Receber novo log em formato JSON"""
    db_log = Log(
        start_time=log.start,
        end_time=log.end,
        source=log.source,
        type=log.type,
        identifier=log.identifier,
        data=log.data,
        location=log.location,
        environment=log.environment,
        status_code=log.status_code,
        identifier_2=log.identifier_2,
        identifier_3=log.identifier_3,
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

@router.get("/{log_id}", response_model=LogResponse)
def get_log(log_id: str, db: Session = Depends(get_db)):
    """Obter um log por ID"""
    log = db.query(Log).filter(Log.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    return log

@router.get("/", response_model=list[LogResponse])
def list_logs(
    source: str = None,
    type: str = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """Listar logs com filtros opcionais"""
    query = db.query(Log)

    if source:
        query = query.filter(Log.source == source)
    if type:
        query = query.filter(Log.type == type)

    return query.offset(skip).limit(limit).all()
