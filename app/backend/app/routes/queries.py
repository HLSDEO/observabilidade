import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, exc as sql_exc
from datetime import datetime
from typing import Optional, List, Dict, Any
from app.database import get_db
from app.models.log import Log
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/queries", tags=["queries"])


class AggregationQuery(BaseModel):
    source: str
    aggregation: str
    field: Optional[str] = None
    filters: Optional[Dict[str, Any]] = None
    groupBy: Optional[List[str]] = None
    fr: Optional[datetime] = None
    to: Optional[datetime] = None


class DetailsQuery(BaseModel):
    source: str
    filters: Optional[Dict[str, Any]] = None
    fr: Optional[datetime] = None
    to: Optional[datetime] = None
    limit: int = 100


def agg_target(field: Optional[str]):
    """Resolve a coluna alvo da agregação. 'duration' = (end_time - start_time) em segundos."""
    if field == "duration":
        return func.extract("epoch", Log.end_time - Log.start_time)
    return getattr(Log, field, Log.id)


def string_filter_condition(column, value):
    """Constrói condição de filtro para colunas de texto (ex: identifier).

    Suporta:
      - lista (JSON) -> casa com qualquer um dos valores
      - string separada por vírgula -> casa com qualquer um dos valores
      - curinga '*' -> traduzido para LIKE ('API-APEX-*' -> 'API-APEX-%')
      - valor simples -> comparação exata
    """
    if isinstance(value, list):
        terms = value
    elif isinstance(value, str):
        terms = [t.strip() for t in value.split(",") if t.strip()]
    else:
        terms = [value]

    clauses = []
    for term in terms:
        if isinstance(term, str) and "*" in term:
            # Escapa curingas de LIKE já existentes, depois converte '*' -> '%'
            pattern = (
                term.replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_")
                .replace("*", "%")
            )
            clauses.append(column.like(pattern, escape="\\"))
        else:
            clauses.append(column == term)

    if not clauses:
        return None
    if len(clauses) == 1:
        return clauses[0]
    return or_(*clauses)


def build_where_clause(query, filters: Optional[Dict[str, Any]], source: str, fr: Optional[datetime], to: Optional[datetime]):
    conditions = [Log.source == source]

    if fr:
        conditions.append(Log.start_time >= fr)
    if to:
        conditions.append(Log.start_time <= to)

    if filters:
        for field, value in filters.items():
            if field == "type":
                if isinstance(value, list):
                    conditions.append(Log.type.in_(value))
                else:
                    conditions.append(Log.type == value)
            elif field == "identifier_2":
                cond = string_filter_condition(Log.identifier_2, value)
                if cond is not None:
                    conditions.append(cond)
            elif field == "identifier":
                cond = string_filter_condition(Log.identifier, value)
                if cond is not None:
                    conditions.append(cond)
            elif field == "environment":
                if isinstance(value, list):
                    conditions.append(Log.environment.in_(value))
                else:
                    conditions.append(Log.environment == value)
            elif field == "status_code":
                if isinstance(value, dict) and "$ne" in value:
                    conditions.append(Log.status_code != value["$ne"])
                elif isinstance(value, list):
                    conditions.append(Log.status_code.in_(value))
                else:
                    conditions.append(Log.status_code == value)

    return query.filter(and_(*conditions))


@router.post("/aggregate")
def aggregate_query(query_data: AggregationQuery, db: Session = Depends(get_db)):
    try:
        logger.debug(
            f"Aggregate query: source={query_data.source}, aggregation={query_data.aggregation}, groupBy={query_data.groupBy}"
        )
        query = db.query(Log)
        query = build_where_clause(query, query_data.filters, query_data.source, query_data.fr, query_data.to)

        group_by_fields = []
        if query_data.groupBy:
            for field in query_data.groupBy:
                if field == "type":
                    group_by_fields.append(Log.type)
                elif field == "identifier":
                    group_by_fields.append(Log.identifier)
                elif field == "identifier_2":
                    group_by_fields.append(Log.identifier_2)
                elif field == "environment":
                    group_by_fields.append(Log.environment)
                elif field == "status_code":
                    group_by_fields.append(Log.status_code)

        if query_data.aggregation == "count":
            agg_expr = func.count(Log.id)
            if group_by_fields:
                query = query.with_entities(*group_by_fields, agg_expr.label("count"))
                query = query.group_by(*group_by_fields)
            else:
                query = query.with_entities(agg_expr.label("count"))

            result = query.all()
            if group_by_fields:
                return [
                    {
                        **{
                            query_data.groupBy[i]: val
                            for i, val in enumerate(row[:-1])
                        },
                        "count": row[-1],
                    }
                    for row in result
                ]
            else:
                return [{"count": result[0][0]}] if result else [{"count": 0}]

        elif query_data.aggregation == "sum":
            if not query_data.field:
                return {"error": "field required for sum aggregation"}
            agg_expr = func.sum(agg_target(query_data.field))
            if group_by_fields:
                query = query.with_entities(*group_by_fields, agg_expr.label("sum"))
                query = query.group_by(*group_by_fields)
            else:
                query = query.with_entities(agg_expr.label("sum"))

            result = query.all()
            if group_by_fields:
                return [
                    {
                        **{
                            query_data.groupBy[i]: val
                            for i, val in enumerate(row[:-1])
                        },
                        "sum": row[-1],
                    }
                    for row in result
                ]
            else:
                return [{"sum": result[0][0]}] if result else [{"sum": 0}]

        elif query_data.aggregation == "avg":
            if not query_data.field:
                return {"error": "field required for avg aggregation"}
            agg_expr = func.avg(agg_target(query_data.field))
            if group_by_fields:
                query = query.with_entities(*group_by_fields, agg_expr.label("avg"))
                query = query.group_by(*group_by_fields)
            else:
                query = query.with_entities(agg_expr.label("avg"))

            result = query.all()
            if group_by_fields:
                return [
                    {
                        **{
                            query_data.groupBy[i]: val
                            for i, val in enumerate(row[:-1])
                        },
                        "avg": row[-1],
                    }
                    for row in result
                ]
            else:
                return [{"avg": result[0][0]}] if result else [{"avg": 0}]

        return {"error": "Unknown aggregation"}
    except sql_exc.OperationalError as e:
        logger.error(f"Database operational error during aggregate: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail="Database connection error")
    except sql_exc.SQLAlchemyError as e:
        logger.error(f"Database error during aggregate: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Database error")
    except Exception as e:
        logger.error(f"Unexpected error during aggregate: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Server error")


@router.post("/details")
def details_query(query_data: DetailsQuery, db: Session = Depends(get_db)):
    try:
        logger.debug(
            f"Details query: source={query_data.source}, filters={query_data.filters}, limit={query_data.limit}"
        )
        query = db.query(Log)
        query = build_where_clause(query, query_data.filters, query_data.source, query_data.fr, query_data.to)

        logs = query.order_by(Log.start_time.desc()).limit(query_data.limit).all()
        logger.debug(f"Retrieved {len(logs)} logs")

        return [
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
    except sql_exc.OperationalError as e:
        logger.error(f"Database operational error during details: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail="Database connection error")
    except sql_exc.SQLAlchemyError as e:
        logger.error(f"Database error during details: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Database error")
    except Exception as e:
        logger.error(f"Unexpected error during details: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Server error")


@router.get("/metrics")
def get_metrics(db: Session = Depends(get_db)):
    try:
        logger.debug("Metrics requested")
        return {
            "numericFields": ["duration"],
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
            "aggregationFunctions": ["count", "sum", "avg", "min", "max", "distinct"],
        }
    except Exception as e:
        logger.error(f"Error getting metrics: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get metrics")
