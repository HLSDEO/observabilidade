import React, { useEffect, useState } from 'react';
import { CardConfig, AggregationResult, QueryDetailsResponse } from '../types';
import { ChartRenderer } from './ChartRenderer';
import { queryService } from '../services/queryService';

interface DashboardCardProps {
  card: CardConfig;
  timeRange: { from: Date; to: Date };
  onDetailClick?: (data: QueryDetailsResponse) => void;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  card,
  timeRange,
  onDetailClick,
}) => {
  const [data, setData] = useState<AggregationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await queryService.aggregate({
        source: card.query.source,
        aggregation: card.query.aggregation as any,
        field: card.query.field,
        groupBy: card.query.groupBy,
        filters: card.query.filters,
        from_: timeRange.from.toISOString(),
        to: timeRange.to.toISOString(),
      });

      setData(response);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [card, timeRange]);

  const handleDataPointClick = async (value: any) => {
    if (!card.detailsEnabled || !onDetailClick) return;

    try {
      setLoading(true);
      const groupByField = card.query.groupBy?.[0];
      const clickedValue = value?.[groupByField];

      const filters: Record<string, any> = {
        ...card.query.filters,
      };

      if (groupByField && clickedValue) {
        filters[groupByField] = clickedValue;
      }

      const response = await queryService.getDetails({
        source: card.query.source,
        filters,
        from_: timeRange.from.toISOString(),
        to: timeRange.to.toISOString(),
        limit: 100,
        offset: 0,
      });

      onDetailClick(response);
    } catch (err) {
      console.error('Error fetching details:', err);
      setError('Erro ao carregar detalhes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{card.title}</h3>
        {loading && <span className="text-sm text-gray-500">Carregando...</span>}
      </div>

      {error ? (
        <div className="bg-red-50 text-red-800 p-4 rounded">
          <p className="text-sm">{error}</p>
          <button
            onClick={fetchData}
            className="mt-2 btn-secondary text-sm"
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        <div onClick={() => handleDataPointClick(data?.[0])}>
          <ChartRenderer
            type={card.type}
            data={data}
            config={card}
            onDataPointClick={handleDataPointClick}
          />
        </div>
      )}

      {card.detailsEnabled && !loading && data.length > 0 && (
        <div className="mt-4 text-center">
          <button
            onClick={() => handleDataPointClick(data?.[0])}
            className="btn-secondary text-sm"
          >
            📋 Detalhar Dados
          </button>
        </div>
      )}
    </div>
  );
};
