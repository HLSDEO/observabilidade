"""Seed do dashboard padrão para o ETL de Viaturas (etl-viaturas).

Reflete a convenção de eventos emitida pelo cliente de observabilidade do
projeto `etl-viaturas` (ver `etl/config/observability.py`):

| identifier | identifier_2                          | descrição                       |
|------------|---------------------------------------|---------------------------------|
| EXECUCAO   | -                                     | execução completa do pipeline   |
| ETAPA      | extracao_*/carga_*                    | fase do pipeline (com duração)  |
| API        | veiculos/abastecimentos/manutencoes   | requisição à API Sisatec        |
| CARGA      | veiculos/abastecimentos/manutencoes   | publicação de um registro       |
| DLQ        | veiculos/abastecimentos/manutencoes   | registro enviado para a DLQ     |
"""
from sqlalchemy.orm import Session
from app.models.dashboard import Dashboard

DEFAULT_DASHBOARD_NAME = "ETL Viaturas - Visão Geral"

SOURCE = "etl-viaturas"

ROTAS = ["veiculos", "abastecimentos", "manutencoes"]


def _default_config() -> dict:
    return {
        "refreshInterval": 30,
        "cards": [
            # ---------- KPIs ----------
            {
                "id": "kpi-execucoes-ok",
                "title": "Execuções OK",
                "type": "gauge",
                "query": {
                    "source": SOURCE,
                    "aggregation": "count",
                    "filters": {"type": "success", "identifier": "EXECUCAO"},
                },
            },
            {
                "id": "kpi-execucoes-falha",
                "title": "Execuções com falha",
                "type": "gauge",
                "query": {
                    "source": SOURCE,
                    "aggregation": "count",
                    "filters": {"type": "error", "identifier": "EXECUCAO"},
                },
                "thresholds": [
                    {"value": 0, "color": "#22c55e"},
                    {"value": 1, "color": "#ef4444"},
                ],
            },
            {
                "id": "kpi-tempo-execucao",
                "title": "Tempo médio / execução (s)",
                "type": "gauge",
                "query": {
                    "source": SOURCE,
                    "aggregation": "avg",
                    "field": "duration",
                    "filters": {"type": "success", "identifier": "EXECUCAO"},
                },
            },
            {
                "id": "kpi-veiculos-ok",
                "title": "Veículos carregados",
                "type": "gauge",
                "query": {
                    "source": SOURCE,
                    "aggregation": "count",
                    "filters": {"type": "success", "identifier": "CARGA", "identifier_2": "veiculos"},
                },
            },
            {
                "id": "kpi-abastecimentos-ok",
                "title": "Abastecimentos carregados",
                "type": "gauge",
                "query": {
                    "source": SOURCE,
                    "aggregation": "count",
                    "filters": {"type": "success", "identifier": "CARGA", "identifier_2": "abastecimentos"},
                },
            },
            {
                "id": "kpi-manutencoes-ok",
                "title": "Manutenções carregadas",
                "type": "gauge",
                "query": {
                    "source": SOURCE,
                    "aggregation": "count",
                    "filters": {"type": "success", "identifier": "CARGA", "identifier_2": "manutencoes"},
                },
            },
            {
                "id": "kpi-carga-falha",
                "title": "Falhas de carga (total)",
                "type": "gauge",
                "query": {
                    "source": SOURCE,
                    "aggregation": "count",
                    "filters": {"type": "error", "identifier": "CARGA"},
                },
                "thresholds": [
                    {"value": 0, "color": "#22c55e"},
                    {"value": 1, "color": "#f59e0b"},
                    {"value": 50, "color": "#ef4444"},
                ],
            },
            # ---------- Carga por rota ----------
            {
                "id": "carga-sucesso-rota",
                "title": "Registros carregados por rota (sucesso)",
                "type": "bar",
                "query": {
                    "source": SOURCE,
                    "aggregation": "count",
                    "filters": {"type": "success", "identifier": "CARGA"},
                    "groupBy": ["identifier_2"],
                },
                "axes": {
                    "x": {"label": "Rota", "key": "identifier_2"},
                    "y": {"label": "Registros", "key": "count"},
                },
                "detailsEnabled": True,
            },
            {
                "id": "carga-falha-rota",
                "title": "Falhas de carga por rota",
                "type": "bar",
                "query": {
                    "source": SOURCE,
                    "aggregation": "count",
                    "filters": {"type": "error", "identifier": "CARGA"},
                    "groupBy": ["identifier_2"],
                },
                "axes": {
                    "x": {"label": "Rota", "key": "identifier_2"},
                    "y": {"label": "Falhas", "key": "count"},
                },
                "detailsEnabled": True,
            },
            # ---------- API Sisatec (origem) ----------
            {
                "id": "api-sucesso-rota",
                "title": "Requisições à API Sisatec (sucesso)",
                "type": "bar",
                "query": {
                    "source": SOURCE,
                    "aggregation": "count",
                    "filters": {"type": "success", "identifier": "API"},
                    "groupBy": ["identifier_2"],
                },
                "axes": {
                    "x": {"label": "Rota", "key": "identifier_2"},
                    "y": {"label": "Requisições", "key": "count"},
                },
            },
            {
                "id": "api-falha-rota",
                "title": "Falhas na API Sisatec por rota",
                "type": "bar",
                "query": {
                    "source": SOURCE,
                    "aggregation": "count",
                    "filters": {"type": "error", "identifier": "API"},
                    "groupBy": ["identifier_2"],
                },
                "axes": {
                    "x": {"label": "Rota", "key": "identifier_2"},
                    "y": {"label": "Falhas", "key": "count"},
                },
                "detailsEnabled": True,
            },
            # ---------- Etapas do pipeline ----------
            {
                "id": "etapa-duracao",
                "title": "Tempo médio por etapa (s)",
                "type": "bar",
                "query": {
                    "source": SOURCE,
                    "aggregation": "avg",
                    "field": "duration",
                    "filters": {"type": "success", "identifier": "ETAPA"},
                    "groupBy": ["identifier_2"],
                },
                "axes": {
                    "x": {"label": "Etapa", "key": "identifier_2"},
                    "y": {"label": "Segundos", "key": "avg"},
                },
            },
            {
                "id": "etapa-falhas",
                "title": "Falhas por etapa",
                "type": "bar",
                "query": {
                    "source": SOURCE,
                    "aggregation": "count",
                    "filters": {"type": "error", "identifier": "ETAPA"},
                    "groupBy": ["identifier_2"],
                },
                "axes": {
                    "x": {"label": "Etapa", "key": "identifier_2"},
                    "y": {"label": "Falhas", "key": "count"},
                },
                "detailsEnabled": True,
            },
            # ---------- DLQ ----------
            {
                "id": "dlq-rota",
                "title": "Registros enviados à DLQ por rota",
                "type": "bar",
                "query": {
                    "source": SOURCE,
                    "aggregation": "count",
                    "filters": {"identifier": "DLQ"},
                    "groupBy": ["identifier_2"],
                },
                "axes": {
                    "x": {"label": "Rota", "key": "identifier_2"},
                    "y": {"label": "Registros", "key": "count"},
                },
                "detailsEnabled": True,
            },
            # ---------- Distribuições ----------
            {
                "id": "distrib-tipo",
                "title": "Distribuição de eventos por tipo",
                "type": "pie",
                "query": {
                    "source": SOURCE,
                    "aggregation": "count",
                    "groupBy": ["type"],
                },
            },
            {
                "id": "distrib-carga-rota",
                "title": "Distribuição de carga por rota",
                "type": "pie",
                "query": {
                    "source": SOURCE,
                    "aggregation": "count",
                    "filters": {"identifier": "CARGA"},
                    "groupBy": ["identifier_2"],
                },
            },
        ],
    }


def seed_viaturas_dashboard(db: Session) -> None:
    """Cria ou atualiza o dashboard padrão do ETL de Viaturas.

    Assim como os demais seeds, se o dashboard já existe o `config` é
    sobrescrito com a versão mais recente — mudanças nos cards entram em vigor
    no próximo restart do backend, sem precisar apagar o dashboard manualmente.
    """
    description = "Visão geral do pipeline de ETL de viaturas (gerado automaticamente)."
    config = _default_config()
    existing = (
        db.query(Dashboard)
        .filter(Dashboard.name == DEFAULT_DASHBOARD_NAME)
        .first()
    )
    if existing:
        existing.description = description
        existing.config = config
    else:
        db.add(Dashboard(
            name=DEFAULT_DASHBOARD_NAME,
            description=description,
            config=config,
        ))
    db.commit()
