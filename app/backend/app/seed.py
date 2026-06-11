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
# Falha ao listar os contratos "Ativo" de uma UG na API do comprasnet
# (https://contratos.comprasnet.gov.br/api/contrato/ug/{UG}). Quando ocorre, a
# unidade inteira é pulada, pois a coleta depende dessa lista de IDs.
IDENTIFIER_LISTAGEM_UG = "API-COMPRASNET-UG"
# Falha ao consultar o detalhe de um contrato na API do PNCP
# (https://pncp.gov.br/api/pncp/v1/orgaos/{cnpj}/contratos/{ano}/{seq}). Quando ocorre,
# o contrato segue sem os identificadores do PNCP (numeroControlePNCP/Compra/tipoPessoa).
IDENTIFIER_PNCP = "API-PNCP"


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
                "id": "kpi-listagem-ug-falha",
                "title": "UGs com falha na listagem (API)",
                "type": "gauge",
                "query": {
                    "source": SOURCE,
                    "aggregation": "count",
                    "filters": {"type": "error", "identifier": IDENTIFIER_LISTAGEM_UG},
                },
            },
            {
                "id": "kpi-pncp-falha",
                "title": "Falha na API do PNCP",
                "type": "gauge",
                "query": {
                    "source": SOURCE,
                    "aggregation": "count",
                    "filters": {"type": "error", "identifier": IDENTIFIER_PNCP},
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
                "id": "listagem-ug-falha-unidade",
                "title": "Falha ao listar contratos da UG (API comprasnet)",
                "type": "bar",
                "query": {
                    "source": SOURCE,
                    "aggregation": "count",
                    "filters": {"type": "error", "identifier": IDENTIFIER_LISTAGEM_UG},
                    "groupBy": ["identifier_2"],
                },
                "axes": {
                    "x": {"label": "Unidade", "key": "identifier_2"},
                    "y": {"label": "Falhas", "key": "count"},
                },
            },
            {
                "id": "pncp-falha-unidade",
                "title": "Falha na API do PNCP por unidade",
                "type": "bar",
                "query": {
                    "source": SOURCE,
                    "aggregation": "count",
                    "filters": {"type": "error", "identifier": IDENTIFIER_PNCP},
                    "groupBy": ["identifier_2"],
                },
                "axes": {
                    "x": {"label": "Unidade", "key": "identifier_2"},
                    "y": {"label": "Falhas", "key": "count"},
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
    """Cria ou atualiza o dashboard padrão do robô de contratos.

    Se já existe, sobrescreve o `config` com a versão mais recente do seed - assim
    mudanças nos cards/identificadores (ex: o card de falha na listagem da UG)
    entram em vigor no próximo restart do backend, sem precisar apagar o dashboard
    manualmente.
    """
    description = "Visão geral do robô de coleta de contratos (gerado automaticamente)."
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
