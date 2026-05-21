import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { dashboardService, queryService } from '../services/api';
import ChartRenderer from '../components/ChartRenderer';
import DetailModal from '../components/DetailModal';
import { subHours, subDays, startOfDay, endOfDay } from 'date-fns';

export default function DashboardViewer() {
  const { id } = useParams<{ id: string }>();
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cardData, setCardData] = useState<{ [key: string]: any }>({});
  const [timeRange, setTimeRange] = useState('24h');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [selectedModal, setSelectedModal] = useState<any>(null);
  const [modalData, setModalData] = useState<any[]>([]);

  useEffect(() => {
    loadDashboard();
  }, [id]);

  useEffect(() => {
    if (dashboard) {
      loadCardData();
      const interval = setInterval(loadCardData, (dashboard.config?.refreshInterval || 30) * 1000);
      return () => clearInterval(interval);
    }
  }, [dashboard, timeRange, customDateFrom, customDateTo]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await dashboardService.get(id!);
      setDashboard(response.data);
      setError(null);
    } catch (err: any) {
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
        if (customDateFrom) {
          from = new Date(customDateFrom);
        } else {
          from = subHours(now, 24);
        }
        if (customDateTo) {
          to = new Date(customDateTo);
        }
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
      for (const card of dashboard.config.cards) {
        const query = {
          ...card.query,
          fr: from,
          to: to,
        };

        const response = await queryService.aggregate(query);
        newCardData[card.id] = response.data;
      }

      setCardData(newCardData);
      setError(null);
    } catch (err: any) {
      setError('Erro ao carregar dados dos gráficos');
      console.error(err);
    }
  };

  const handleChartClick = async (cardId: string, cardConfig: any, clickValue: any) => {
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
        to: to,
        limit: 1000,
      };

      const response = await queryService.details(detailsQuery);
      setModalData(response.data);
      setSelectedModal(cardConfig);
    } catch (err: any) {
      setError('Erro ao carregar detalhes');
      console.error(err);
    }
  };

  if (loading) {
    return <div className="loading">Carregando dashboard...</div>;
  }

  if (!dashboard) {
    return <div className="error">Dashboard não encontrado</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">{dashboard.name}</h1>
          {dashboard.description && (
            <p className="text-gray-700 mt-2">{dashboard.description}</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-8">
        <div className="flex gap-4 items-center">
          <label className="font-bold">Período:</label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="24h">Últimas 24h</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="custom">Personalizado</option>
          </select>

          {timeRange === 'custom' && (
            <div className="flex gap-4">
              <input
                type="datetime-local"
                value={customDateFrom}
                onChange={(e) => setCustomDateFrom(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
                placeholder="De"
              />
              <input
                type="datetime-local"
                value={customDateTo}
                onChange={(e) => setCustomDateTo(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Até"
              />
            </div>
          )}
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="grid grid-2">
        {dashboard.config?.cards?.map((card: any) => (
          <div key={card.id} className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{card.title}</h3>
            {cardData[card.id] ? (
              <ChartRenderer
                type={card.type}
                data={cardData[card.id]}
                config={card}
                onDataPointClick={(value: any) => handleChartClick(card.id, card, value)}
              />
            ) : (
              <div className="loading">Carregando...</div>
            )}
          </div>
        ))}
      </div>

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
