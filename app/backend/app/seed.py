"""Seed do dashboard padrão para o robô de contratos."""
from sqlalchemy.orm import Session
from app.models.dashboard import Dashboard

DEFAULT_DASHBOARD_NAME = "Robô Contratos - Visão Geral"

SOURCE = "robo-contratos"
API_IDENTIFIERS = [
    "API-APEX-CONTRATOS",
    "API-APEX-HISTORICO",
    "API-APEX-EMPENHOS",
    "API-APEX-FATURAS",
    "API-APEX-FISCAIS",
]


def _default_config() -> dict:
    return {
        "refreshInterval": 30,
        "cards": [
            # ---------- KPIs ----------
            {
                "id": "kpi-contratos-ok",
                "title": "Contratos sucesso",
                "type": "gauge",
                "query": {
                    "source": SOURCE,
                    "aggregation": "count",
                    "filters": {"type": "success", "identifier": "CONTRATO"},
                },
            },
            {
                "id": "kpi-contratos-falha",
                "title": "Contratos falha",
                "type": "gauge",
                "query": {
                    "source": SOURCE,
                    "aggregation": "count",
                    "filters": {"type": "error", "identifier": "API-APEX-CONTRATOS"},
                },
            },
            {
                "id": "kpi-unidades-ok",
                "title": "Unidades OK",
                "type": "gauge",
                "query": {
                    "source": SOURCE,
                    "aggregation": "count",
                    "filters": {"type": "success", "identifier": "UNIDADE"},
                },
            },
            {
                "id": "kpi-unidades-falha",
                "title": "Unidades falha",
                "type": "gauge",
                "query": {
                    "source": SOURCE,
                    "aggregation": "count",
                    "filters": {"type": "error", "identifier": "UNIDADE"},
                },
            },
            {
                "id": "kpi-tempo-unidade",
                "title": "Tempo médio / unidade (s)",
                "type": "gauge",
                "query": {
                    "source": SOURCE,
                    "aggregation": "avg",
                    "field": "duration",
                    "filters": {"type": "success", "identifier": "UNIDADE"},
                },
            },
            {
                "id": "kpi-tempo-contrato",
                "title": "Tempo médio / contrato (s)",
                "type": "gauge",
                "query": {
                    "source": SOURCE,
                    "aggregation": "avg",
                    "field": "duration",
                    "filters": {"type": "success", "identifier": "CONTRATO"},
                },
            },
            # ---------- Requisições API por tipo ----------
            {
                "id": "api-success",
                "title": "Requisições API por Tipo (Success)",
                "type": "bar",
                "query": {
                    "source": SOURCE,
                    "aggregation": "count",
                    "filters": {"type": "success", "identifier": API_IDENTIFIERS},
                    "groupBy": ["identifier"],
                },
                "axes": {
                    "x": {"label": "API", "key": "identifier"},
                    "y": {"label": "Requisições", "key": "count"},
                },
            },
            {
                "id": "api-falha",
                "title": "Requisições API por Tipo (Falha)",
                "type": "bar",
                "query": {
                    "source": SOURCE,
                    "aggregation": "count",
                    "filters": {"type": "error", "identifier": API_IDENTIFIERS},
                    "groupBy": ["identifier"],
                },
                "axes": {
                    "x": {"label": "API", "key": "identifier"},
                    "y": {"label": "Falhas", "key": "count"},
                },
            },
            # ---------- Por unidade ----------
            {
                "id": "contratos-unidade",
                "title": "Contratos por unidade",
                "type": "bar",
                "query": {
                    "source": SOURCE,
                    "aggregation": "count",
                    "filters": {"type": "success", "identifier": "CONTRATO"},
                    "groupBy": ["identifier_2"],
                },
                "axes": {
                    "x": {"label": "Unidade", "key": "identifier_2"},
                    "y": {"label": "Contratos", "key": "count"},
                },
            },
            {
                "id": "erros-unidade",
                "title": "Total de erros por unidade",
                "type": "bar",
                "query": {
                    "source": SOURCE,
                    "aggregation": "count",
                    "filters": {"type": "error"},
                    "groupBy": ["identifier_2"],
                },
                "axes": {
                    "x": {"label": "Unidade", "key": "identifier_2"},
                    "y": {"label": "Erros", "key": "count"},
                },
            },
        ],
    }


def seed_default_dashboard(db: Session) -> None:
    """Cria o dashboard padrão se ainda não existir."""
    exists = (
        db.query(Dashboard)
        .filter(Dashboard.name == DEFAULT_DASHBOARD_NAME)
        .first()
    )
    if exists:
        return

    dashboard = Dashboard(
        name=DEFAULT_DASHBOARD_NAME,
        description="Visão geral do robô de coleta de contratos (gerado automaticamente).",
        config=_default_config(),
    )
    db.add(dashboard)
    db.commit()
