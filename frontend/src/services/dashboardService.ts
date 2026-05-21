import api from './api';
import { Dashboard, DashboardConfig } from '../types';

export const dashboardService = {
  // Listar todos os dashboards
  listDashboards: async (skip = 0, limit = 100): Promise<Dashboard[]> => {
    const response = await api.get('/dashboards', {
      params: { skip, limit },
    });
    return response.data;
  },

  // Obter um dashboard por ID
  getDashboard: async (id: string): Promise<Dashboard> => {
    const response = await api.get(`/dashboards/${id}`);
    return response.data;
  },

  // Criar novo dashboard
  createDashboard: async (
    name: string,
    description: string,
    config: DashboardConfig
  ): Promise<Dashboard> => {
    const response = await api.post('/dashboards', {
      name,
      description,
      config,
    });
    return response.data;
  },

  // Atualizar dashboard
  updateDashboard: async (
    id: string,
    updates: Partial<{ name: string; description: string; config: DashboardConfig }>
  ): Promise<Dashboard> => {
    const response = await api.put(`/dashboards/${id}`, updates);
    return response.data;
  },

  // Deletar dashboard
  deleteDashboard: async (id: string): Promise<void> => {
    await api.delete(`/dashboards/${id}`);
  },
};
