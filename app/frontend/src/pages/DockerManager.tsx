import React, { useEffect, useRef, useState } from 'react';
import { dockerService } from '../services/api';

interface Container {
  id: string;
  name: string;
  image: string;
  status: string;
  state: string;
  ports: string;
  project: string;
  service: string;
}

function stateBadge(state: string): string {
  if (state === 'running') return 'success';
  if (state === 'exited') return 'error';
  return 'warning';
}

export default function DockerManager() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const [logsFor, setLogsFor] = useState<Container | null>(null);
  const [logsText, setLogsText] = useState('');
  const [logsLoading, setLogsLoading] = useState(false);

  const msgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = async () => {
    try {
      const res = await dockerService.listContainers();
      setContainers(res.data.containers || []);
      setError(null);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail || 'Erro ao carregar os containers'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [autoRefresh]);

  const flash = (msg: string) => {
    setActionMsg(msg);
    if (msgTimer.current) clearTimeout(msgTimer.current);
    msgTimer.current = setTimeout(() => setActionMsg(null), 4000);
  };

  const containerAction = async (
    c: Container,
    action: 'start' | 'stop' | 'restart'
  ) => {
    setBusy(true);
    try {
      await dockerService.containerAction(c.id, action);
      const verb =
        action === 'start' ? 'iniciado' : action === 'stop' ? 'parado' : 'reiniciado';
      flash(`Container "${c.name}" ${verb}.`);
      await load();
    } catch (err: any) {
      flash(err?.response?.data?.detail || `Falha ao ${action} o container`);
    } finally {
      setBusy(false);
    }
  };

  const composeAction = async (action: 'up' | 'down' | 'restart') => {
    setBusy(true);
    try {
      await dockerService.composeAction(action);
      const verb =
        action === 'up' ? 'iniciados' : action === 'down' ? 'parados' : 'reiniciados';
      flash(`Serviços do compose ${verb}.`);
      await load();
    } catch (err: any) {
      flash(err?.response?.data?.detail || `Falha ao executar "${action}"`);
    } finally {
      setBusy(false);
    }
  };

  const openLogs = async (c: Container) => {
    setLogsFor(c);
    setLogsText('');
    setLogsLoading(true);
    try {
      const res = await dockerService.getContainerLogs(c.id, 200);
      setLogsText(res.data.logs || '(sem logs)');
    } catch (err: any) {
      setLogsText(err?.response?.data?.detail || 'Erro ao carregar logs');
    } finally {
      setLogsLoading(false);
    }
  };

  const running = containers.filter((c) => c.state === 'running').length;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <div className="page-label">Infraestrutura</div>
            <div className="page-title">Docker Manager</div>
            <div className="page-subtitle">
              Gerencie os containers do host via socket do Docker. {running} de{' '}
              {containers.length} em execução.
            </div>
          </div>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <span>Auto-atualizar (5s)</span>
          </label>
        </div>
      </div>

      {actionMsg && (
        <div className="card" style={{ borderColor: 'var(--border2)' }}>
          <span className="badge info">info</span>{' '}
          <span style={{ marginLeft: 8 }}>{actionMsg}</span>
        </div>
      )}

      {error && <div className="error-state section-gap">{error}</div>}

      <div className="card section-gap">
        <div className="card-title">Docker Compose</div>
        <div className="button-row">
          <button className="button" disabled={busy} onClick={() => composeAction('up')}>
            Subir tudo
          </button>
          <button
            className="button secondary"
            disabled={busy}
            onClick={() => composeAction('restart')}
          >
            Reiniciar tudo
          </button>
          <button
            className="button danger"
            disabled={busy}
            onClick={() => composeAction('down')}
          >
            Parar tudo
          </button>
        </div>
        <div className="refresh-meta">
          Ações aplicadas a todos os containers de projetos docker compose no host.
        </div>
      </div>

      <div className="card section-gap">
        <div className="card-title">Containers ({containers.length})</div>
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
          </div>
        ) : containers.length === 0 ? (
          <div className="empty-state">Nenhum container encontrado.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Nome</th>
                  <th>Imagem</th>
                  <th>Portas</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {containers.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span className={`badge ${stateBadge(c.state)}`}>{c.status}</span>
                    </td>
                    <td>
                      <div>{c.name}</div>
                      {c.service && (
                        <div className="muted mono" style={{ fontSize: 11 }}>
                          {c.project} / {c.service}
                        </div>
                      )}
                    </td>
                    <td className="mono" style={{ fontSize: 12, maxWidth: 260 }}>
                      {c.image}
                    </td>
                    <td className="mono muted" style={{ fontSize: 12 }}>
                      {c.ports || '—'}
                    </td>
                    <td>
                      <div className="button-row">
                        <button className="button subtle" onClick={() => openLogs(c)}>
                          Logs
                        </button>
                        {c.state === 'running' ? (
                          <>
                            <button
                              className="button subtle"
                              disabled={busy}
                              onClick={() => containerAction(c, 'restart')}
                            >
                              Reiniciar
                            </button>
                            <button
                              className="button danger"
                              disabled={busy}
                              onClick={() => containerAction(c, 'stop')}
                            >
                              Parar
                            </button>
                          </>
                        ) : (
                          <button
                            className="button"
                            disabled={busy}
                            onClick={() => containerAction(c, 'start')}
                          >
                            Iniciar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {logsFor && (
        <div className="modal-overlay" onClick={() => setLogsFor(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div className="card-title" style={{ marginBottom: 0 }}>
                Logs · {logsFor.name}
              </div>
              <div className="flex items-center gap-8">
                <button
                  className="button subtle"
                  disabled={logsLoading}
                  onClick={() => openLogs(logsFor)}
                >
                  Atualizar
                </button>
                <button className="modal-close" onClick={() => setLogsFor(null)}>
                  ×
                </button>
              </div>
            </div>
            {logsLoading ? (
              <div className="loading-state">
                <div className="spinner" />
              </div>
            ) : (
              <pre
                className="mono"
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: 16,
                  fontSize: 12,
                  lineHeight: 1.6,
                  maxHeight: '64vh',
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  margin: 0,
                }}
              >
                {logsText}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
