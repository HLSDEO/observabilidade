import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dashboard, DashboardConfig, CardConfig } from '../types';
import { dashboardService } from '../services/dashboardService';

export const DashboardEditor: React.FC = () => {
  const navigate = useNavigate();
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    refreshInterval: 30,
  });
  const [config, setConfig] = useState<DashboardConfig>({
    id: '',
    name: '',
    refreshInterval: 30,
    cards: [],
  });

  useEffect(() => {
    fetchDashboards();
  }, []);

  const fetchDashboards = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.listDashboards();
      setDashboards(data);
    } catch (err) {
      console.error('Error fetching dashboards:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', refreshInterval: 30 });
    setConfig({ id: '', name: '', refreshInterval: 30, cards: [] });
    setEditingId(null);
    setShowEditor(false);
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const finalConfig = {
        ...config,
        id: config.id || `dashboard-${Date.now()}`,
        name: formData.name,
        refreshInterval: formData.refreshInterval,
      };

      if (editingId) {
        await dashboardService.updateDashboard(editingId, {
          name: formData.name,
          description: formData.description,
          config: finalConfig,
        });
      } else {
        await dashboardService.createDashboard(
          formData.name,
          formData.description,
          finalConfig
        );
      }

      await fetchDashboards();
      resetForm();
    } catch (err) {
      console.error('Error saving dashboard:', err);
      alert('Erro ao salvar dashboard');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja deletar este dashboard?')) return;

    try {
      await dashboardService.deleteDashboard(id);
      await fetchDashboards();
    } catch (err) {
      console.error('Error deleting dashboard:', err);
      alert('Erro ao deletar dashboard');
    }
  };

  const handleAddCard = () => {
    const newCard: CardConfig = {
      id: `card-${Date.now()}`,
      title: 'Novo Gráfico',
      type: 'bar',
      query: {
        source: 'robo-contratos',
        aggregation: 'count',
      },
      detailsEnabled: true,
    };

    setConfig({
      ...config,
      cards: [...config.cards, newCard],
    });
  };

  const handleRemoveCard = (cardId: string) => {
    setConfig({
      ...config,
      cards: config.cards.filter((c) => c.id !== cardId),
    });
  };

  const handleUpdateCard = (cardId: string, updates: Partial<CardConfig>) => {
    setConfig({
      ...config,
      cards: config.cards.map((c) =>
        c.id === cardId ? { ...c, ...updates } : c
      ),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Carregando dashboards...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Meus Dashboards</h1>
        <button
          onClick={() => {
            resetForm();
            setShowEditor(true);
          }}
          className="btn-primary"
        >
          + Novo Dashboard
        </button>
      </div>

      {/* Dashboards List */}
      {!showEditor && dashboards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboards.map((dashboard) => (
            <div key={dashboard.id} className="card hover:shadow-lg transition">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {dashboard.name}
              </h3>
              {dashboard.description && (
                <p className="text-gray-600 text-sm mb-3">
                  {dashboard.description}
                </p>
              )}
              <p className="text-gray-500 text-xs mb-4">
                {dashboard.config.cards.length} cards
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/dashboard/${dashboard.id}`)}
                  className="flex-1 btn-primary text-sm"
                >
                  Visualizar
                </button>
                <button
                  onClick={() => {
                    setEditingId(dashboard.id);
                    setFormData({
                      name: dashboard.name,
                      description: dashboard.description || '',
                      refreshInterval: dashboard.config.refreshInterval || 30,
                    });
                    setConfig(dashboard.config);
                    setShowEditor(true);
                  }}
                  className="flex-1 btn-secondary text-sm"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(dashboard.id)}
                  className="flex-1 btn-danger text-sm"
                >
                  Deletar
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : !showEditor ? (
        <div className="card text-center py-12">
          <p className="text-gray-600 mb-4">Nenhum dashboard criado ainda</p>
          <button
            onClick={() => setShowEditor(true)}
            className="btn-primary"
          >
            Criar Primeiro Dashboard
          </button>
        </div>
      ) : null}

      {/* Editor */}
      {showEditor && (
        <div className="card mt-8 max-w-4xl">
          <h2 className="text-2xl font-bold mb-6">
            {editingId ? 'Editar Dashboard' : 'Novo Dashboard'}
          </h2>

          <form onSubmit={handleCreateOrUpdate} className="space-y-6">
            {/* Formulário Básico */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="input-field h-24"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Intervalo de Auto-atualização (segundos)
              </label>
              <input
                type="number"
                min="10"
                step="10"
                value={formData.refreshInterval}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    refreshInterval: Number(e.target.value),
                  })
                }
                className="input-field"
              />
            </div>

            {/* Cards Editor */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Gráficos</h3>
                <button
                  type="button"
                  onClick={handleAddCard}
                  className="btn-secondary text-sm"
                >
                  + Adicionar Gráfico
                </button>
              </div>

              <div className="space-y-4">
                {config.cards.map((card) => (
                  <div key={card.id} className="border border-gray-200 p-4 rounded">
                    <div className="flex justify-between mb-4">
                      <h4 className="font-semibold">{card.title}</h4>
                      <button
                        type="button"
                        onClick={() => handleRemoveCard(card.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Título"
                        value={card.title}
                        onChange={(e) =>
                          handleUpdateCard(card.id, { title: e.target.value })
                        }
                        className="input-field"
                      />

                      <select
                        value={card.type}
                        onChange={(e) =>
                          handleUpdateCard(card.id, { type: e.target.value as any })
                        }
                        className="input-field"
                      >
                        <option value="line">Linha</option>
                        <option value="bar">Barra</option>
                        <option value="pie">Pizza</option>
                        <option value="gauge">Gauge</option>
                      </select>

                      <input
                        type="text"
                        placeholder="Source"
                        value={card.query.source}
                        onChange={(e) =>
                          handleUpdateCard(card.id, {
                            query: { ...card.query, source: e.target.value },
                          })
                        }
                        className="input-field"
                      />

                      <select
                        value={card.query.aggregation}
                        onChange={(e) =>
                          handleUpdateCard(card.id, {
                            query: {
                              ...card.query,
                              aggregation: e.target.value,
                            },
                          })
                        }
                        className="input-field"
                      >
                        <option value="count">Contagem</option>
                        <option value="sum">Soma</option>
                        <option value="avg">Média</option>
                        <option value="min">Mínimo</option>
                        <option value="max">Máximo</option>
                      </select>
                    </div>

                    <div className="mt-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={card.detailsEnabled || false}
                          onChange={(e) =>
                            handleUpdateCard(card.id, {
                              detailsEnabled: e.target.checked,
                            })
                          }
                        />
                        <span className="text-sm text-gray-700">
                          Permitir detalhamento de dados
                        </span>
                      </label>
                    </div>

                    <div className="mt-4 p-3 bg-gray-50 rounded text-xs font-mono text-gray-600">
                      <pre>{JSON.stringify(card.query, null, 2)}</pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-4">
              <button type="submit" className="btn-primary">
                {editingId ? 'Atualizar' : 'Criar'} Dashboard
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default DashboardEditor;
