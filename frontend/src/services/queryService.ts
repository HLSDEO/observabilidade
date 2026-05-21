import api from './api';
import {
  AggregationResult,
  QueryAggregateRequest,
  QueryDetailsRequest,
  QueryDetailsResponse,
} from '../types';

export const queryService = {
  // Executar agregação
  aggregate: async (request: QueryAggregateRequest): Promise<AggregationResult[]> => {
    const response = await api.post('/queries/aggregate', request);
    return response.data;
  },

  // Obter logs detalhados
  getDetails: async (request: QueryDetailsRequest): Promise<QueryDetailsResponse> => {
    const response = await api.post('/queries/details', request);
    return response.data;
  },

  // Listar métricas disponíveis
  getMetrics: async () => {
    const response = await api.get('/queries/metrics');
    return response.data;
  },
};
