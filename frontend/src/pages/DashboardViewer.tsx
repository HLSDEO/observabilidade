import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DashboardCard } from '../components/DashboardCard';
import { TimeRangeFilter } from '../components/TimeRangeFilter';
import { DetailModal } from '../components/DetailModal';
import { Dashboard, QueryDetailsResponse } from '../types';
import { dashboardService } from '../services/dashboardService';
import { subHours } from 'date-fns';

export const DashboardViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<{ from: Date; to: Date }>({
    from: subHours(new Date(), 24),
    to: new Date(),
  });
  const [detailsData, setDetailsData] = useState<QueryDetailsResponse | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState<number | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const data = await dashboardService.getDashboard(id);
        setDashboard(data);
        setAutoRefresh(data.config.refreshInterval || null);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [id]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !dashboard) return;

    const interval = setInterval(() => {
      // Trigger re-render de componentes filhos
      setTimeRange((prev) => ({ ...prev }));
    }, autoRefresh * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, dashboard]);

  const handleDetailClick = (data: QueryDetailsResponse) => {
    setDetailsData(data);
    setShowDetails(true);
  };

  const handleLoadMore = async () => {
    if (!detailsData) return;

    try {
      // TODO: Implementar carregamento de mais resultados
      // const newOffset = detailsData.offset + detailsData.limit;
      // const moreData = await queryService.getDetails({...});
    } catch (err) {
      console.error('Error loading more data:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Carregando dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-800 p-6 rounded">
        <h2 className="text-xl font-bold mb-2">Erro</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="bg-yellow-50 text-yellow-800 p-6 rounded">
        <h2 className="text-xl font-bold mb-2">Dashboard não encontrado</h2>
        <p>O dashboard solicitado não existe.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Dashboard Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {dashboard.name}
        </h1>
        {dashboard.description && (
          <p className="text-gray-600">{dashboard.description}</p>
        )}
      </div>

      {/* Time Range Filter */}
      <TimeRangeFilter onRangeChange={(from, to) => setTimeRange({ from, to })} />

      {/* Auto-refresh Control */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">
            Auto-atualizar a cada:
          </label>
          <select
            value={autoRefresh || ''}
            onChange={(e) => setAutoRefresh(e.target.value ? Number(e.target.value) : null)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
          >
            <option value="">Desativado</option>
            <option value="10">10 segundos</option>
            <option value="30">30 segundos</option>
            <option value="60">1 minuto</option>
            <option value="300">5 minutos</option>
          </select>
          {autoRefresh && (
            <span className="text-sm text-gray-500">
              ✓ Atualizando a cada {autoRefresh}s
            </span>
          )}
        </div>
      </div>

      {/* Dashboard Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {dashboard.config.cards.map((card) => (
          <DashboardCard
            key={card.id}
            card={card}
            timeRange={timeRange}
            onDetailClick={handleDetailClick}
          />
        ))}
      </div>

      {/* Details Modal */}
      <DetailModal
        isOpen={showDetails}
        data={detailsData}
        onClose={() => setShowDetails(false)}
        onLoadMore={handleLoadMore}
      />
    </div>
  );
};

export default DashboardViewer;
