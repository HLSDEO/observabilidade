from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.log import Log
from app.schemas.log_schema import LogCreate, LogResponse

router = APIRouter(prefix="/api/logs", tags=["logs"])


@router.post("", response_model=LogResponse)
def create_log(log_data: LogCreate, db: Session = Depends(get_db)):
    log = Log(
        start_time=log_data.start,
        end_time=log_data.end,
        source=log_data.source,
        type=log_data.type,
        identifier=log_data.identifier,
        data=log_data.data,
        location=log_data.location,
        environment=log_data.environment,
        status_code=log_data.status_code,
        identifier_2=log_data.identifier_2,
        identifier_3=log_data.identifier_3,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.get("/{log_id}", response_model=LogResponse)
def get_log(log_id: str, db: Session = Depends(get_db)):
    log = db.query(Log).filter(Log.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    return log
