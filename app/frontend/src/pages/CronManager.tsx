import React, { useEffect, useState } from 'react';
import { cronService } from '../services/api';

interface CronJob {
  id: string;
  name: string;
  schedule: string;
  user: string;
  command: string;
  enabled: boolean;
  source: string;
  source_label: string;
  read_only: boolean;
}

const PRESETS: { label: string; value: string }[] = [
  { label: 'A cada minuto', value: '* * * * *' },
  { label: 'A cada 5 minutos', value: '*/5 * * * *' },
  { label: 'A cada 15 minutos', value: '*/15 * * * *' },
  { label: 'A cada hora', value: '0 * * * *' },
  { label: 'Diariamente (00:00)', value: '0 0 * * *' },
  { label: 'Diariamente (06:00)', value: '0 6 * * *' },
  { label: 'Semanalmente (dom 00:00)', value: '0 0 * * 0' },
  { label: 'Na inicialização', value: '@reboot' },
];

const EMPTY: Omit<CronJob, 'id'> = {
  name: '',
  schedule: '0 6 * * *',
  user: 'root',
  command: '',
  enabled: true,
  source: 'managed',
  source_label: '/etc/cron.d/observabilidade',
  read_only: false,
};

export default function CronManager() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<CronJob, 'id'>>(EMPTY);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const res = await cronService.list();
      setJobs(res.data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar os jobs de cron');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY);
    setShowForm(true);
  };

  const openEdit = (job: CronJob) => {
    setEditingId(job.id);
    setForm({
      name: job.name,
      schedule: job.schedule,
      user: job.user,
      command: job.command,
      enabled: job.enabled,
      source: job.source,
      source_label: job.source_label,
      read_only: job.read_only,
    });
    setShowForm(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        schedule: form.schedule,
        user: form.user,
        command: form.command,
        enabled: form.enabled,
      };

      if (editingId) {
        await cronService.update(editingId, payload);
      } else {
        await cronService.create(payload);
      }
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY);
      setError(null);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Erro ao salvar o job');
      console.error(err);
    }
  };

  const toggle = async (job: CronJob) => {
    try {
      await cronService.toggle(job.id);
      await load();
    } catch (err) {
      setError('Erro ao alternar o job');
      console.error(err);
    }
  };

  const remove = async (job: CronJob) => {
    if (!window.confirm(`Remover o job "${job.name}"?`)) return;
    try {
      await cronService.remove(job.id);
      await load();
    } catch (err) {
      setError('Erro ao remover o job');
      console.error(err);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <div className="page-label">Agendamento</div>
            <div className="page-title">Cron da VM</div>
            <div className="page-subtitle">
              Gerencie os jobs do arquivo /etc/cron.d/observabilidade e, quando o backend
              estiver configurado com o spool do host, visualize também entradas criadas via
              crontab -e em modo somente leitura.
            </div>
          </div>
          <button className="button" onClick={openNew}>
            + Novo job
          </button>
        </div>
      </div>

      {error && <div className="error-state">{error}</div>}

      {showForm && (
        <div className="card">
          <div className="card-title">{editingId ? 'Editar job' : 'Novo job'}</div>
          <form onSubmit={submit} className="stack">
            <div className="grid-2">
              <div className="field">
                <label>Nome</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Coleta de contratos"
                  required
                />
              </div>
              <div className="field">
                <label>Usuário</label>
                <input
                  value={form.user}
                  onChange={(e) => setForm({ ...form, user: e.target.value })}
                  placeholder="root"
                />
              </div>
              <div className="field">
                <label>Agendamento (cron)</label>
                <input
                  value={form.schedule}
                  onChange={(e) => setForm({ ...form, schedule: e.target.value })}
                  placeholder="0 6 * * *"
                  className="mono"
                  required
                />
              </div>
              <div className="field">
                <label>Presets</label>
                <select
                  value=""
                  onChange={(e) =>
                    e.target.value && setForm({ ...form, schedule: e.target.value })
                  }
                >
                  <option value="">Escolher preset...</option>
                  {PRESETS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label} ({p.value})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="field">
              <label>Comando</label>
              <input
                value={form.command}
                onChange={(e) => setForm({ ...form, command: e.target.value })}
                placeholder="cd /opt/robo && /usr/bin/python3 main.py >> /var/log/robo.log 2>&1"
                className="mono"
                required
              />
            </div>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
              />
              <span>Job ativo</span>
            </label>
            <div className="button-row">
              <button type="submit" className="button">
                {editingId ? 'Salvar alterações' : 'Criar job'}
              </button>
              <button
                type="button"
                className="button secondary"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card section-gap">
        <div className="card-title">Jobs agendados ({jobs.length})</div>
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="empty-state">Nenhum job agendado. Clique em "Novo job".</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Nome</th>
                  <th>Agendamento</th>
                  <th>Usuário</th>
                  <th>Origem</th>
                  <th>Comando</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td>
                      <span className={`badge ${job.enabled ? 'success' : 'warning'}`}>
                        {job.enabled ? 'ativo' : 'pausado'}
                      </span>
                    </td>
                    <td>{job.name}</td>
                    <td className="mono" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                      {job.schedule}
                    </td>
                    <td className="muted">{job.user}</td>
                    <td className="muted">{job.source_label}</td>
                    <td className="mono" style={{ fontSize: 12, maxWidth: 360 }}>
                      {job.command}
                    </td>
                    <td>
                      {job.read_only ? (
                        <span className="muted">Somente leitura</span>
                      ) : (
                        <div className="button-row">
                          <button className="button subtle" onClick={() => toggle(job)}>
                            {job.enabled ? 'Pausar' : 'Ativar'}
                          </button>
                          <button className="button subtle" onClick={() => openEdit(job)}>
                            Editar
                          </button>
                          <button className="button danger" onClick={() => remove(job)}>
                            Remover
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
