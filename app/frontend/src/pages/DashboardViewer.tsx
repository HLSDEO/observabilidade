import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dashboardService, queryService } from '../services/api';
import ChartRenderer from '../components/ChartRenderer';
import DetailModal from '../components/DetailModal';
import { subMinutes, subHours, subDays } from 'date-fns';

const KPI_TONES = ['accent', 'red', 'green', 'yellow', 'purple', 'blue'];

const TIME_RANGES = [
  { value: '5m', label: 'Últimos 5 minutos' },
  { value: '1h', label: 'Última 1 hora' },
  { value: '4h', label: 'Últimas 4 horas' },
  { value: '24h', label: 'Últimas 24 horas' },
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: 'custom', label: 'Personalizado' },
];

export default function DashboardViewer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cardData, setCardData] = useState<{ [key: string]: any }>({});
  const [timeRange, setTimeRange] = useState('24h');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [selectedModal, setSelectedModal] = useState<any>(null);
  const [modalData, setModalData] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Mantém sempre a versão mais recente de loadCardData para o setInterval
  const loadRef = useRef<() => void>(() => {});

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!dashboard) return;
    loadRef.current();
    const ms = (dashboard.config?.refreshInterval || 30) * 1000;
    const interval = setInterval(() => loadRef.current(), ms);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboard, timeRange, customDateFrom, customDateTo]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await dashboardService.get(id!);
      setDashboard(response.data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar dashboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getTimeRangeParams = () => {
    const now = new Date();
    let from: Date;
    let to = now;

    switch (timeRange) {
      case '5m':
        from = subMinutes(now, 5);
        break;
      case '1h':
        from = subHours(now, 1);
        break;
      case '4h':
        from = subHours(now, 4);
        break;
      case '24h':
        from = subHours(now, 24);
        break;
      case '7d':
        from = subDays(now, 7);
        break;
      case '30d':
        from = subDays(now, 30);
        break;
      case 'custom':
        from = customDateFrom ? new Date(customDateFrom) : subHours(now, 24);
        if (customDateTo) to = new Date(customDateTo);
        break;
      default:
        from = subHours(now, 24);
    }

    return { from: from.toISOString(), to: to.toISOString() };
  };

  const loadCardData = async () => {
    if (!dashboard?.config?.cards) return;
    const { from, to } = getTimeRangeParams();
    const newCardData: { [key: string]: any } = {};

    try {
      setRefreshing(true);
      for (const card of dashboard.config.cards) {
        const query = { ...card.query, fr: from, to };
        const response = await queryService.aggregate(query);
        newCardData[card.id] = response.data;
      }
      setCardData(newCardData);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError('Erro ao carregar dados dos gráficos');
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  // Mantém o ref apontando para a versão atual (com o timeRange corrente)
  loadRef.current = loadCardData;

  const handleChartClick = async (cardConfig: any, clickValue: any) => {
    try {
      const { from, to } = getTimeRangeParams();
      const filters: any = { ...cardConfig.query.filters };
      if (cardConfig.query.groupBy && cardConfig.query.groupBy.length > 0) {
        const groupByField = cardConfig.query.groupBy[0];
        filters[groupByField] = clickValue[groupByField];
      }
      const detailsQuery = {
        source: cardConfig.query.source,
        filters,
        fr: from,
        to,
        limit: 1000,
      };
      const response = await queryService.details(detailsQuery);
      setModalData(response.data);
      setSelectedModal(cardConfig);
    } catch (err) {
      setError('Erro ao carregar detalhes');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <div style={{ marginTop: 12 }}>Carregando dashboard...</div>
      </div>
    );
  }

  if (!dashboard) {
    return <div className="error-state">Dashboard não encontrado</div>;
  }

  const cards = dashboard.config?.cards || [];
  const gaugeCards = cards.filter((c: any) => c.type === 'gauge');
  const chartCards = cards.filter((c: any) => c.type !== 'gauge');

  const kpiValue = (cardId: string) => {
    const data = cardData[cardId];
    if (!data || !data[0]) return '0';
    const v = data[0].count ?? data[0].sum ?? data[0].avg ?? 0;
    if (typeof v !== 'number') return v;
    return Number.isInteger(v)
      ? v.toLocaleString('pt-BR')
      : v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <div
              className="page-label"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/dashboards')}
            >
              ← Dashboards
            </div>
            <div className="page-title">{dashboard.name}</div>
            {dashboard.description && (
              <div className="page-subtitle">{dashboard.description}</div>
            )}
          </div>
          <div className="toolbar">
            <div className="field">
              <label>Período</label>
              <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
                {TIME_RANGES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>&nbsp;</label>
              <button
                className="button secondary"
                onClick={loadCardData}
                disabled={refreshing}
              >
                {refreshing ? '↻ Atualizando...' : '↻ Atualizar'}
              </button>
            </div>
            <div className="field">
              <label>&nbsp;</label>
              <button className="button" onClick={() => navigate(`/dashboard/${id}/edit`)}>
                Editar
              </button>
            </div>
          </div>
        </div>
        <div className="refresh-meta mono">
          <span>
            auto-refresh a cada {dashboard.config?.refreshInterval || 30}s
          </span>
          {lastUpdated && (
            <span>
              • atualizado às {lastUpdated.toLocaleTimeString('pt-BR')}
            </span>
          )}
        </div>
        {timeRange === 'custom' && (
          <div className="toolbar" style={{ marginTop: 12 }}>
            <div className="field">
              <label>De</label>
              <input
                type="datetime-local"
                value={customDateFrom}
                onChange={(e) => setCustomDateFrom(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Até</label>
              <input
                type="datetime-local"
                value={customDateTo}
                onChange={(e) => setCustomDateTo(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {error && <div className="error-state">{error}</div>}

      {cards.length === 0 && (
        <div className="card">
          <div className="empty-state">Este dashboard não possui gráficos configurados.</div>
        </div>
      )}

      {gaugeCards.length > 0 && (
        <div className="kpi-grid">
          {gaugeCards.map((card: any, idx: number) => (
            <div key={card.id} className={`stat-card ${KPI_TONES[idx % KPI_TONES.length]}`}>
              <div className="stat-label">{card.title}</div>
              <div className="stat-value">{kpiValue(card.id)}</div>
              <div className="stat-sub">no período selecionado</div>
            </div>
          ))}
        </div>
      )}

      {chartCards.length > 0 && (
        <div className="grid-2 section-gap">
          {chartCards.map((card: any) => (
            <div key={card.id} className="card">
              <div className="card-head">
                <div className="card-title">{card.title}</div>
                <span className="badge info">{card.type}</span>
              </div>
              {cardData[card.id] ? (
                <ChartRenderer
                  type={card.type}
                  data={cardData[card.id]}
                  config={card}
                  onDataPointClick={(value: any) => handleChartClick(card, value)}
                />
              ) : (
                <div className="loading-state">
                  <div className="spinner" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedModal && (
        <DetailModal
          isOpen={!!selectedModal}
          logs={modalData}
          cardTitle={selectedModal.title}
          onClose={() => {
            setSelectedModal(null);
            setModalData([]);
          }}
        />
      )}
    </div>
  );
}
