import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../services/api';

export default function DashboardEditor() {
  const navigate = useNavigate();
  const [dashboards, setDashboards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    config: {
      refreshInterval: 30,
      cards: [],
    },
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
    } catch (err) {
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
      setFormData({ name: '', description: '', config: { refreshInterval: 30, cards: [] } });
      setShowForm(false);
      setError(null);
    } catch (err) {
      setError('Erro ao criar dashboard');
      console.error(err);
    }
  };

  const handleDeleteDashboard = async (id: string) => {
    if (window.confirm('Tem certeza que deseja deletar este dashboard?')) {
      try {
        await dashboardService.delete(id);
        setDashboards(dashboards.filter((d) => d.id !== id));
        setError(null);
      } catch (err) {
        setError('Erro ao deletar dashboard');
        console.error(err);
      }
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <div className="page-label">Gerenciamento</div>
            <div className="page-title">Dashboards</div>
            <div className="page-subtitle">
              Crie, visualize e gerencie seus painéis de observabilidade.
            </div>
          </div>
          <button className="button" onClick={() => setShowForm(!showForm)}>
            + Novo dashboard
          </button>
        </div>
      </div>

      {error && <div className="error-state">{error}</div>}

      {showForm && (
        <div className="card section-gap">
          <div className="card-title">Criar novo dashboard</div>
          <form onSubmit={handleCreateDashboard} className="stack">
            <div className="field">
              <label>Nome *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Robô Contratos - Monitoramento"
                required
              />
            </div>
            <div className="field">
              <label>Descrição</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o propósito deste dashboard"
              />
            </div>
            <div className="field" style={{ maxWidth: 280 }}>
              <label>Intervalo de refresh (segundos)</label>
              <input
                type="number"
                value={formData.config.refreshInterval}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    config: { ...formData.config, refreshInterval: parseInt(e.target.value) },
                  })
                }
                min="10"
              />
            </div>
            <div className="button-row">
              <button type="submit" className="button">
                Criar dashboard
              </button>
              <button type="button" className="button secondary" onClick={() => setShowForm(false)}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <div style={{ marginTop: 12 }}>Carregando dashboards...</div>
        </div>
      ) : dashboards.length === 0 ? (
        <div className="card section-gap">
          <div className="empty-state">
            <div style={{ fontSize: 32, marginBottom: 12 }}>▦</div>
            <div>Nenhum dashboard criado ainda.</div>
            <div className="button-row" style={{ justifyContent: 'center', marginTop: 16 }}>
              <button className="button" onClick={() => setShowForm(true)}>
                Criar primeiro dashboard
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid-3 section-gap">
          {dashboards.map((dashboard) => (
            <div
              key={dashboard.id}
              className="card card-clickable"
              onClick={() => navigate(`/dashboard/${dashboard.id}`)}
            >
              <div className="card-title" style={{ color: 'var(--text)', textTransform: 'none', fontSize: 16 }}>
                {dashboard.name}
              </div>
              {dashboard.description && (
                <div className="muted" style={{ fontSize: 13, marginBottom: 14, minHeight: 38 }}>
                  {dashboard.description}
                </div>
              )}
              <div className="pill-row" style={{ marginBottom: 16 }}>
                <span className="badge info">
                  {dashboard.config?.cards?.length || 0} cards
                </span>
                <span className="badge">
                  ↻ {dashboard.config?.refreshInterval || 30}s
                </span>
              </div>
              <div className="button-row" onClick={(e) => e.stopPropagation()}>
                <button
                  className="button"
                  style={{ flex: 1 }}
                  onClick={() => navigate(`/dashboard/${dashboard.id}`)}
                >
                  Abrir
                </button>
                <button className="button danger" onClick={() => handleDeleteDashboard(dashboard.id)}>
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
