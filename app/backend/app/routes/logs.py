import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.log import Log
from app.schemas.log_schema import LogCreate, LogResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/logs", tags=["logs"])


@router.post("", response_model=LogResponse)
def create_log(log_data: LogCreate, db: Session = Depends(get_db)):
    try:
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
        logger.debug(f"Log criado: {log.id} ({log.source}/{log.identifier})")
        return log
    except Exception as e:
        db.rollback()
        logger.error(f"Erro ao criar log: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create log")


@router.get("/{log_id}", response_model=LogResponse)
def get_log(log_id: str, db: Session = Depends(get_db)):
    try:
        log = db.query(Log).filter(Log.id == log_id).first()
        if not log:
            raise HTTPException(status_code=404, detail="Log not found")
        logger.debug(f"Log recuperado: {log_id}")
        return log
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao recuperar log {log_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve log")
