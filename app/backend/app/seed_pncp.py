"""Seed do dashboard padrão para o robo-pncp."""
from sqlalchemy.orm import Session
from app.models.dashboard import Dashboard

DEFAULT_DASHBOARD_NAME = "Robô PNCP - Visão Geral"

SOURCE = "robo-pncp"

ETAPAS = [
    "editais",
    "itens_resultados",
    "atas",
    "contratos_comprasnet",
    "arp",
    "hierarquia_itens",
]

APIS = [
    "PNCP_EDITAIS",
    "PNCP_ITENS",
    "PNCP_DETALHE_ITEM",
    "PNCP_ATAS",
    "COMPRASNET_CONTRATOS_UG",
    "COMPRASNET_CONTRATO_HISTORICO",
    "COMPRASNET_CONTRATO_EMPENHOS",
    "COMPRASNET_CONTRATO_ITENS",
    "COMPRASNET_CONTRATO_FATURAS",
    "DADOSABERTOS_MATERIAL",
    "DADOSABERTOS_SERVICO",
    "DADOSABERTOS_ARP",
]


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
            },
            {
                "id": "kpi-editais",
                "title": "Editais coletados",
                "type": "gauge",
                "query": {
                    "source": SOURCE,
                    "aggregation": "count",
                    "filters": {"type": "success", "identifier": "EDITAL"},
                },
            },
            {
                "id": "kpi-contratos",
                "title": "Contratos coletados (Comprasnet)",
                "type": "gauge",
                "query": {
                    "source": SOURCE,
                    "aggregation": "count",
                    "filters": {"type": "success", "identifier": "CONTRATO"},
                },
            },
            {
                "id": "kpi-contratos-com-edital",
                "title": "Contratos com edital PNCP",
                "type": "gauge",
                "query": {
                    "source": SOURCE,
                    "aggregation": "count",
                    "filters": {
                        "type": "success",
                        "identifier": "MATCH_EDITAL_PNCP",
                        "identifier_2": "com",
                    },
                },
            },
            {
                "id": "kpi-contratos-sem-edital",
                "title": "Contratos sem edital PNCP",
                "type": "gauge",
                "query": {
                    "source": SOURCE,
                    "aggregation": "count",
                    "filters": {
                        "type": "success",
                        "identifier": "MATCH_EDITAL_PNCP",
                        "identifier_2": "sem",
                    },
                },
            },
            {
                "id": "kpi-atas",
                "title": "Atas coletadas",
                "type": "gauge",
                "query": {
                    "source": SOURCE,
                    "aggregation": "count",
                    "filters": {"type": "success", "identifier": "ATA"},
                },
            },
            {
                "id": "kpi-tempo-etapa",
                "title": "Tempo médio / etapa (s)",
                "type": "gauge",
                "query": {
                    "source": SOURCE,
                    "aggregation": "avg",
                    "field": "duration",
                    "filters": {"type": "success", "identifier": "ETAPA"},
                },
            },
            # ---------- Etapas ----------
            {
                "id": "etapa-duracao",
                "title": "Duração média por etapa (s)",
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
            },
            # ---------- APIs ----------
            {
                "id": "api-sucesso",
                "title": "Requisições API (Sucesso)",
                "type": "bar",
                "query": {
                    "source": SOURCE,
                    "aggregation": "count",
                    "filters": {"type": "success", "identifier": "API"},
                    "groupBy": ["identifier_2"],
                },
                "axes": {
                    "x": {"label": "API", "key": "identifier_2"},
                    "y": {"label": "Requisições", "key": "count"},
                },
            },
            {
                "id": "api-falha",
                "title": "Requisições API (Falha)",
                "type": "bar",
                "query": {
                    "source": SOURCE,
                    "aggregation": "count",
                    "filters": {"type": "error", "identifier": "API"},
                    "groupBy": ["identifier_2"],
                },
                "axes": {
                    "x": {"label": "API", "key": "identifier_2"},
                    "y": {"label": "Falhas", "key": "count"},
                },
            },
            # ---------- Sub-rotas de contrato (historico, empenhos, itens, faturas) ----------
            {
                "id": "subrotas-contrato-sucesso",
                "title": "Sub-rotas de contrato — requisições OK",
                "type": "bar",
                "query": {
                    "source": SOURCE,
                    "aggregation": "count",
                    "filters": {
                        "type": "success",
                        "identifier": "API",
                        "identifier_2": "COMPRASNET_CONTRATO_*",
                    },
                    "groupBy": ["identifier_2"],
                },
                "axes": {
                    "x": {"label": "Sub-rota", "key": "identifier_2"},
                    "y": {"label": "Requisições", "key": "count"},
                },
            },
            {
                "id": "subrotas-contrato-falha",
                "title": "Sub-rotas de contrato — falhas após retries",
                "type": "bar",
                "query": {
                    "source": SOURCE,
                    "aggregation": "count",
                    "filters": {
                        "type": "error",
                        "identifier": "API",
                        "identifier_2": "COMPRASNET_CONTRATO_*",
                    },
                    "groupBy": ["identifier_2"],
                },
                "axes": {
                    "x": {"label": "Sub-rota", "key": "identifier_2"},
                    "y": {"label": "Falhas", "key": "count"},
                },
            },
            {
                "id": "subrotas-contrato-duracao",
                "title": "Sub-rotas de contrato — duração média (s)",
                "type": "bar",
                "query": {
                    "source": SOURCE,
                    "aggregation": "avg",
                    "field": "duration",
                    "filters": {
                        "type": "success",
                        "identifier": "API",
                        "identifier_2": "COMPRASNET_CONTRATO_*",
                    },
                    "groupBy": ["identifier_2"],
                },
                "axes": {
                    "x": {"label": "Sub-rota", "key": "identifier_2"},
                    "y": {"label": "Segundos", "key": "avg"},
                },
            },
            # ---------- Por unidade ----------
            {
                "id": "editais-unidade",
                "title": "Editais por unidade da PF",
                "type": "bar",
                "query": {
                    "source": SOURCE,
                    "aggregation": "count",
                    "filters": {"type": "success", "identifier": "EDITAL"},
                    "groupBy": ["identifier_2"],
                },
                "axes": {
                    "x": {"label": "Unidade", "key": "identifier_2"},
                    "y": {"label": "Editais", "key": "count"},
                },
            },
            {
                "id": "contratos-unidade",
                "title": "Contratos (Comprasnet) por unidade da PF",
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
                "id": "ug-comprasnet-duracao",
                "title": "Duração da coleta /contrato/ug por unidade (s)",
                "type": "bar",
                "query": {
                    "source": SOURCE,
                    "aggregation": "avg",
                    "field": "duration",
                    "filters": {"type": "success", "identifier": "UG_COMPRASNET"},
                    "groupBy": ["identifier_2"],
                },
                "axes": {
                    "x": {"label": "Unidade", "key": "identifier_2"},
                    "y": {"label": "Segundos", "key": "avg"},
                },
            },
            {
                "id": "erros-unidade",
                "title": "Erros por unidade da PF",
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
            # ---------- Distribuição ----------
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
        ],
    }


def seed_pncp_dashboard(db: Session) -> None:
    """Cria ou atualiza o dashboard padrão do robo-pncp.

    Se já existe, sobrescreve o `config` com a versão mais recente do seed -
    isso garante que mudanças nos identificadores/cards (ex: renomes de tags
    de API) entrem em vigor no próximo restart do backend, sem precisar
    apagar o dashboard manualmente.
    """
    description = "Visão geral do robô de coleta PNCP (gerado automaticamente)."
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
