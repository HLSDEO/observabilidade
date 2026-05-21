import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../services/api';

export default function DashboardEditor() {
  const [dashboards, setDashboards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    config: {
      refreshInterval: 30,
      cards: []
    }
  });

  useEffect(() => {
    loadDashboards();
  }, []);

  const loadDashboards = async () => {
    try {
      setLoading(true);
      const response = await dashboardService.list();
      setDashboards(response.data);
      setError(null);
    } catch (err: any) {
      setError('Erro ao carregar dashboards');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDashboard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await dashboardService.create(formData);
      setDashboards([...dashboards, response.data]);
      setFormData({
        name: '',
        description: '',
        config: { refreshInterval: 30, cards: [] }
      });
      setShowForm(false);
      setError(null);
    } catch (err: any) {
      setError('Erro ao criar dashboard');
      console.error(err);
    }
  };

  const handleDeleteDashboard = async (id: string) => {
    if (window.confirm('Tem certeza que deseja deletar este dashboard?')) {
      try {
        await dashboardService.delete(id);
        setDashboards(dashboards.filter(d => d.id !== id));
        setError(null);
      } catch (err: any) {
        setError('Erro ao deletar dashboard');
        console.error(err);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Dashboards</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Novo Dashboard
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Criar Novo Dashboard</h2>
          <form onSubmit={handleCreateDashboard}>
            <div className="mb-4">
              <label className="block text-gray-700 font-bold mb-2">Nome</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-bold mb-2">Descrição</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                rows={3}
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-bold mb-2">Intervalo de Refresh (segundos)</label>
              <input
                type="number"
                value={formData.config.refreshInterval}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, refreshInterval: parseInt(e.target.value) }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                min="10"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Criar Dashboard
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading">Carregando dashboards...</div>
      ) : dashboards.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-700 text-center">Nenhum dashboard criado ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dashboards.map((dashboard) => (
            <div key={dashboard.id} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{dashboard.name}</h3>
              {dashboard.description && (
                <p className="text-gray-700 mb-4 text-sm">{dashboard.description}</p>
              )}
              <div className="flex gap-2">
                <Link
                  to={`/dashboard/${dashboard.id}`}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-center"
                >
                  Abrir
                </Link>
                <button
                  onClick={() => handleDeleteDashboard(dashboard.id)}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Deletar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
