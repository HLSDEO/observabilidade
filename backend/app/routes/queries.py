from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.database import get_db
from app.models import Log

router = APIRouter(prefix="/queries", tags=["queries"])

def build_filter_condition(filters: Dict[str, Any]):
    """Construir condição WHERE dinamicamente baseado nos filtros"""
    conditions = []

    for field_name, value in filters.items():
        if not hasattr(Log, field_name):
            continue

        column = getattr(Log, field_name)

        if isinstance(value, dict):
            # Operadores especiais: $ne, $gte, $lte, etc
            if "$ne" in value:
                if value["$ne"] is None:
                    conditions.append(column != None)
                else:
                    conditions.append(column != value["$ne"])
            if "$gte" in value:
                conditions.append(column >= value["$gte"])
            if "$lte" in value:
                conditions.append(column <= value["$lte"])
            if "$gt" in value:
                conditions.append(column > value["$gt"])
            if "$lt" in value:
                conditions.append(column < value["$lt"])
        elif isinstance(value, list):
            # IN condition
            conditions.append(column.in_(value))
        else:
            # Igualdade simples
            conditions.append(column == value)

    return and_(*conditions) if conditions else None

@router.post("/aggregate")
def aggregate_logs(
    source: str,
    aggregation: str,
    filters: Optional[Dict[str, Any]] = None,
    field: Optional[str] = None,
    groupBy: Optional[List[str]] = None,
    from_: Optional[datetime] = None,
    to: Optional[datetime] = None,
    db: Session = Depends(get_db),
):
    """
    Executar agregação de logs conforme instrução do dashboard

    Agregações suportadas: count, sum, avg, min, max, distinct
    """

    query = db.query(Log)

    # Filtro de tempo
    if from_ and to:
        query = query.filter(Log.start_time >= from_, Log.start_time <= to)
    elif from_:
        query = query.filter(Log.start_time >= from_)
    elif to:
        query = query.filter(Log.start_time <= to)

    # Filtro de origem (obrigatório)
    query = query.filter(Log.source == source)

    # Filtros adicionais
    if filters:
        filter_condition = build_filter_condition(filters)
        if filter_condition is not None:
            query = query.filter(filter_condition)

    # Agregação
    if aggregation == "count":
        if groupBy:
            # Agrupar por um ou mais campos
            group_columns = [getattr(Log, col) for col in groupBy if hasattr(Log, col)]
            query = query.with_entities(*group_columns, func.count().label("count"))
            query = query.group_by(*group_columns).order_by(func.count().desc())
        else:
            # Contar total
            count = query.count()
            return [{"count": count}]

    elif aggregation == "sum" and field:
        if not hasattr(Log, field):
            raise HTTPException(status_code=400, detail=f"Field '{field}' not found")

        column = getattr(Log, field)
        if groupBy:
            group_columns = [getattr(Log, col) for col in groupBy if hasattr(Log, col)]
            query = query.with_entities(*group_columns, func.sum(column).label("sum"))
            query = query.group_by(*group_columns).order_by(func.sum(column).desc())
        else:
            total = query.with_entities(func.sum(column)).scalar()
            return [{"sum": total}]

    elif aggregation == "avg" and field:
        if not hasattr(Log, field):
            raise HTTPException(status_code=400, detail=f"Field '{field}' not found")

        column = getattr(Log, field)
        if groupBy:
            group_columns = [getattr(Log, col) for col in groupBy if hasattr(Log, col)]
            query = query.with_entities(*group_columns, func.avg(column).label("avg"))
            query = query.group_by(*group_columns).order_by(func.avg(column).desc())
        else:
            average = query.with_entities(func.avg(column)).scalar()
            return [{"avg": average}]

    elif aggregation == "min" and field:
        if not hasattr(Log, field):
            raise HTTPException(status_code=400, detail=f"Field '{field}' not found")

        column = getattr(Log, field)
        if groupBy:
            group_columns = [getattr(Log, col) for col in groupBy if hasattr(Log, col)]
            query = query.with_entities(*group_columns, func.min(column).label("min"))
            query = query.group_by(*group_columns)
        else:
            minimum = query.with_entities(func.min(column)).scalar()
            return [{"min": minimum}]

    elif aggregation == "max" and field:
        if not hasattr(Log, field):
            raise HTTPException(status_code=400, detail=f"Field '{field}' not found")

        column = getattr(Log, field)
        if groupBy:
            group_columns = [getattr(Log, col) for col in groupBy if hasattr(Log, col)]
            query = query.with_entities(*group_columns, func.max(column).label("max"))
            query = query.group_by(*group_columns)
        else:
            maximum = query.with_entities(func.max(column)).scalar()
            return [{"max": maximum}]

    elif aggregation == "distinct" and groupBy:
        group_columns = [getattr(Log, col) for col in groupBy if hasattr(Log, col)]
        query = query.with_entities(*group_columns, func.count().label("count"))
        query = query.group_by(*group_columns).order_by(func.count().desc())

    else:
        raise HTTPException(status_code=400, detail=f"Aggregation '{aggregation}' not supported or missing required parameters")

    # Executar e retornar resultado
    results = query.all()

    # Converter ResultProxy para dicionário
    output = []
    if results:
        columns = [col.key if hasattr(col, 'key') else str(col) for col in query.statement.columns]
        for row in results:
            row_dict = {}
            for i, col in enumerate(columns):
                row_dict[col] = row[i]
            output.append(row_dict)

    return output


@router.post("/details")
def get_log_details(
    source: str,
    filters: Optional[Dict[str, Any]] = None,
    from_: Optional[datetime] = None,
    to: Optional[datetime] = None,
    limit: int = 1000,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    """
    Obter logs completos para detalhar dados (modal)
    """

    query = db.query(Log)

    # Filtro de tempo
    if from_ and to:
        query = query.filter(Log.start_time >= from_, Log.start_time <= to)
    elif from_:
        query = query.filter(Log.start_time >= from_)
    elif to:
        query = query.filter(Log.start_time <= to)

    # Filtro de origem
    query = query.filter(Log.source == source)

    # Filtros adicionais
    if filters:
        filter_condition = build_filter_condition(filters)
        if filter_condition is not None:
            query = query.filter(filter_condition)

    # Ordenar por mais recente
    query = query.order_by(Log.start_time.desc())

    # Total de registros
    total = query.count()

    # Paginação
    logs = query.offset(offset).limit(limit).all()

    # Converter para dicionário
    logs_data = [
        {
            "id": str(log.id),
            "start_time": log.start_time.isoformat(),
            "end_time": log.end_time.isoformat(),
            "source": log.source,
            "type": log.type,
            "identifier": log.identifier,
            "data": log.data,
            "location": log.location,
            "environment": log.environment,
            "status_code": log.status_code,
            "identifier_2": log.identifier_2,
            "identifier_3": log.identifier_3,
            "created_at": log.created_at.isoformat(),
        }
        for log in logs
    ]

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "data": logs_data,
    }


@router.get("/metrics")
def get_available_metrics():
    """Listar campos disponíveis para agregação"""
    return {
        "numericFields": ["duration"],  # Placeholder - pode vir do metadata do schema
        "stringFields": [
            "source",
            "type",
            "identifier",
            "location",
            "environment",
            "status_code",
            "identifier_2",
            "identifier_3",
        ],
        "aggregationFunctions": [
            "count",
            "sum",
            "avg",
            "min",
            "max",
            "distinct",
        ],
    }
