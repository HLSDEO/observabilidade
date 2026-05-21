from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime
from typing import Optional, List, Dict, Any
from app.database import get_db
from app.models.log import Log
from pydantic import BaseModel

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
                if isinstance(value, list):
                    conditions.append(Log.identifier_2.in_(value))
                else:
                    conditions.append(Log.identifier_2 == value)
            elif field == "identifier":
                if isinstance(value, list):
                    conditions.append(Log.identifier.in_(value))
                else:
                    conditions.append(Log.identifier == value)
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


@router.post("/details")
def details_query(query_data: DetailsQuery, db: Session = Depends(get_db)):
    query = db.query(Log)
    query = build_where_clause(query, query_data.filters, query_data.source, query_data.fr, query_data.to)

    logs = query.order_by(Log.start_time.desc()).limit(query_data.limit).all()

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


@router.get("/metrics")
def get_metrics(db: Session = Depends(get_db)):
    return {
        "numericFields": [],
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
