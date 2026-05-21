import axios from 'axios';

// Descobre o backend pelo mesmo host usado no navegador (ex.: 192.168.2.27),
// caindo para localhost em dev. Permite sobrescrever via REACT_APP_API_URL.
const API_URL =
  process.env.REACT_APP_API_URL ||
  `${window.location.protocol}//${window.location.hostname}:8000/api`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const dashboardService = {
  list: () => api.get('/dashboards'),
  get: (id: string) => api.get(`/dashboards/${id}`),
  create: (data: any) => api.post('/dashboards', data),
  update: (id: string, data: any) => api.put(`/dashboards/${id}`, data),
  delete: (id: string) => api.delete(`/dashboards/${id}`),
};

export const logService = {
  create: (data: any) => api.post('/logs', data),
  get: (id: string) => api.get(`/logs/${id}`),
};

export const queryService = {
  aggregate: (data: any) => api.post('/queries/aggregate', data),
  details: (data: any) => api.post('/queries/details', data),
  metrics: () => api.get('/queries/metrics'),
};

export const cronService = {
  list: () => api.get('/cron'),
  create: (data: any) => api.post('/cron', data),
  update: (id: string, data: any) => api.put(`/cron/${id}`, data),
  toggle: (id: string) => api.post(`/cron/${id}/toggle`),
  remove: (id: string) => api.delete(`/cron/${id}`),
};

export default api;
