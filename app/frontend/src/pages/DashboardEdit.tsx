import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dashboardService } from '../services/api';

interface EditCard {
  id: string;
  title: string;
  type: string;
  source: string;
  aggregation: string;
  field: string;
  groupBy: string;
  filterType: string;
  max: string;
  xLabel: string;
  yLabel: string;
}

const CHART_TYPES = [
  { value: 'bar', label: 'Barra' },
  { value: 'line', label: 'Linha' },
  { value: 'pie', label: 'Pizza' },
  { value: 'gauge', label: 'Gauge (KPI)' },
  { value: 'table', label: 'Tabela' },
];

const AGGREGATIONS = [
  { value: 'count', label: 'Contagem (count)' },
  { value: 'sum', label: 'Soma (sum)' },
  { value: 'avg', label: 'Média (avg)' },
];

const GROUP_BY_FIELDS = [
  { value: '', label: 'Nenhum' },
  { value: 'type', label: 'Tipo' },
  { value: 'identifier', label: 'Identificador' },
  { value: 'identifier_2', label: 'Identificador 2' },
  { value: 'environment', label: 'Ambiente' },
  { value: 'status_code', label: 'Status code' },
];

const FILTER_TYPES = [
  { value: '', label: 'Todos' },
  { value: 'info', label: 'Info' },
  { value: 'success', label: 'Success' },
  { value: 'warning', label: 'Warning' },
  { value: 'error', label: 'Error' },
  { value: 'danger', label: 'Danger' },
];

function toEditCard(card: any): EditCard {
  return {
    id: card.id || `card-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: card.title || '',
    type: card.type || 'bar',
    source: card.query?.source || '',
    aggregation: card.query?.aggregation || 'count',
    field: card.query?.field || '',
    groupBy: card.query?.groupBy?.[0] || '',
    filterType: card.query?.filters?.type || '',
    max: card.max != null ? String(card.max) : '1000',
    xLabel: card.axes?.x?.label || '',
    yLabel: card.axes?.y?.label || '',
  };
}

function toApiCard(ec: EditCard): any {
  const query: any = { source: ec.source, aggregation: ec.aggregation };
  if (ec.field && ec.aggregation !== 'count') query.field = ec.field;
  if (ec.groupBy) query.groupBy = [ec.groupBy];
  if (ec.filterType) query.filters = { type: ec.filterType };

  const card: any = { id: ec.id, title: ec.title, type: ec.type, query };

  if (ec.groupBy) {
    card.axes = {
      x: { label: ec.xLabel || ec.groupBy, key: ec.groupBy },
      y: { label: ec.yLabel || ec.aggregation, key: ec.aggregation },
    };
  }
  if (ec.type === 'gauge') {
    card.min = 0;
    card.max = Number(ec.max) || 1000;
  }
  return card;
}

function newCard(): EditCard {
  return {
    id: `card-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: 'Novo gráfico',
    type: 'bar',
    source: '',
    aggregation: 'count',
    field: '',
    groupBy: 'type',
    filterType: '',
    max: '1000',
    xLabel: '',
    yLabel: '',
  };
}

export default function DashboardEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [cards, setCards] = useState<EditCard[]>([]);

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await dashboardService.get(id!);
      const d = res.data;
      setName(d.name || '');
      setDescription(d.description || '');
      setRefreshInterval(d.config?.refreshInterval || 30);
      setCards((d.config?.cards || []).map(toEditCard));
      setError(null);
    } catch (err) {
      setError('Erro ao carregar dashboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateCard = (index: number, patch: Partial<EditCard>) => {
    setCards((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  };

  const removeCard = (index: number) => {
    setCards((prev) => prev.filter((_, i) => i !== index));
  };

  const addCard = () => {
    setCards((prev) => [...prev, newCard()]);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('O nome do dashboard é obrigatório');
      return;
    }
    try {
      setSaving(true);
      await dashboardService.update(id!, {
        name,
        description,
        config: {
          refreshInterval: Number(refreshInterval) || 30,
          cards: cards.map(toApiCard),
        },
      });
      setError(null);
      navigate(`/dashboard/${id}`);
    } catch (err) {
      setError('Erro ao salvar dashboard');
      console.error(err);
    } finally {
      setSaving(false);
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
            <div className="page-title">Editar dashboard</div>
            <div className="page-subtitle">
              Ajuste as informações gerais e os gráficos do painel.
            </div>
          </div>
          <div className="button-row">
            <button className="button secondary" onClick={() => navigate(`/dashboard/${id}`)}>
              Cancelar
            </button>
            <button className="button" onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </div>
      </div>

      {error && <div className="error-state">{error}</div>}

      {/* Informações gerais */}
      <div className="card">
        <div className="card-title">Informações gerais</div>
        <div className="stack">
          <div className="field">
            <label>Nome *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label>Descrição</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="field" style={{ maxWidth: 280 }}>
            <label>Intervalo de refresh (segundos)</label>
            <input
              type="number"
              min={10}
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="card section-gap">
        <div className="card-head">
          <div className="card-title">Gráficos ({cards.length})</div>
          <button className="button secondary" onClick={addCard}>
            + Adicionar gráfico
          </button>
        </div>

        {cards.length === 0 ? (
          <div className="empty-state">
            Nenhum gráfico. Clique em "Adicionar gráfico" para começar.
          </div>
        ) : (
          <div className="stack">
            {cards.map((card, index) => (
              <div key={card.id} className="card-edit">
                <div className="card-edit-head">
                  <span className="badge info">{index + 1}</span>
                  <span className="mono muted" style={{ fontSize: 12 }}>
                    {card.id}
                  </span>
                  <button
                    className="button danger ml-auto"
                    onClick={() => removeCard(index)}
                  >
                    Remover
                  </button>
                </div>

                <div className="grid-2">
                  <div className="field">
                    <label>Título</label>
                    <input
                      value={card.title}
                      onChange={(e) => updateCard(index, { title: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label>Tipo de gráfico</label>
                    <select
                      value={card.type}
                      onChange={(e) => updateCard(index, { type: e.target.value })}
                    >
                      {CHART_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>Fonte (source)</label>
                    <input
                      value={card.source}
                      placeholder="ex: robo-contratos"
                      onChange={(e) => updateCard(index, { source: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label>Agregação</label>
                    <select
                      value={card.aggregation}
                      onChange={(e) => updateCard(index, { aggregation: e.target.value })}
                    >
                      {AGGREGATIONS.map((a) => (
                        <option key={a.value} value={a.value}>
                          {a.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {card.aggregation !== 'count' && (
                    <div className="field">
                      <label>Campo numérico (field)</label>
                      <input
                        value={card.field}
                        placeholder="ex: duration"
                        onChange={(e) => updateCard(index, { field: e.target.value })}
                      />
                    </div>
                  )}

                  {card.type !== 'gauge' && (
                    <div className="field">
                      <label>Agrupar por (groupBy)</label>
                      <select
                        value={card.groupBy}
                        onChange={(e) => updateCard(index, { groupBy: e.target.value })}
                      >
                        {GROUP_BY_FIELDS.map((g) => (
                          <option key={g.value} value={g.value}>
                            {g.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="field">
                    <label>Filtrar por tipo</label>
                    <select
                      value={card.filterType}
                      onChange={(e) => updateCard(index, { filterType: e.target.value })}
                    >
                      {FILTER_TYPES.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {card.type === 'gauge' && (
                    <div className="field">
                      <label>Valor máximo (gauge)</label>
                      <input
                        type="number"
                        value={card.max}
                        onChange={(e) => updateCard(index, { max: e.target.value })}
                      />
                    </div>
                  )}

                  {card.type !== 'gauge' && card.groupBy && (
                    <>
                      <div className="field">
                        <label>Rótulo eixo X</label>
                        <input
                          value={card.xLabel}
                          placeholder={card.groupBy}
                          onChange={(e) => updateCard(index, { xLabel: e.target.value })}
                        />
                      </div>
                      <div className="field">
                        <label>Rótulo eixo Y</label>
                        <input
                          value={card.yLabel}
                          placeholder={card.aggregation}
                          onChange={(e) => updateCard(index, { yLabel: e.target.value })}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="button-row section-gap">
        <button className="button" onClick={handleSave} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
        <button className="button secondary" onClick={() => navigate(`/dashboard/${id}`)}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
