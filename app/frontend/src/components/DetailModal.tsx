import React, { useState } from 'react';

interface Props {
  isOpen: boolean;
  logs: any[];
  cardTitle: string;
  onClose: () => void;
}

const typeBadge = (type: string) => {
  switch (type) {
    case 'error':
      return 'badge error';
    case 'success':
      return 'badge success';
    case 'warning':
      return 'badge warning';
    case 'danger':
      return 'badge danger';
    default:
      return 'badge info';
  }
};

export default function DetailModal({ isOpen, logs, cardTitle, onClose }: Props) {
  const [page, setPage] = useState(1);
  const itemsPerPage = 50;
  const totalPages = Math.ceil(logs.length / itemsPerPage);
  const startIdx = (page - 1) * itemsPerPage;
  const paginatedLogs = logs.slice(startIdx, startIdx + itemsPerPage);

  if (!isOpen) return null;

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(paginatedLogs, null, 2));
    alert('Logs copiados para a área de transferência!');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="page-label">Detalhamento</div>
            <div className="page-title" style={{ fontSize: 22 }}>
              {cardTitle}
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </div>

        {logs.length === 0 ? (
          <div className="empty-state">Nenhum log encontrado.</div>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Hora</th>
                    <th>Tipo</th>
                    <th>Identificador</th>
                    <th>Dados</th>
                    <th>Ambiente</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLogs.map((log, idx) => (
                    <tr key={idx}>
                      <td className="mono" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                        {new Date(log.start_time).toLocaleString('pt-BR')}
                      </td>
                      <td>
                        <span className={typeBadge(log.type)}>{log.type}</span>
                      </td>
                      <td className="mono" style={{ fontSize: 12 }}>
                        {log.identifier}
                      </td>
                      <td style={{ maxWidth: 320 }}>{log.data}</td>
                      <td className="muted">{log.environment}</td>
                      <td className="mono" style={{ fontSize: 12 }}>
                        {log.status_code || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div
              className="flex items-center section-gap"
              style={{ justifyContent: 'space-between' }}
            >
              <span className="muted mono" style={{ fontSize: 12 }}>
                Página {page} de {totalPages} • {logs.length} registros
              </span>
              <div className="button-row">
                {totalPages > 1 && (
                  <>
                    <button
                      className="button subtle"
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                    >
                      ← Anterior
                    </button>
                    <button
                      className="button subtle"
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                    >
                      Próxima →
                    </button>
                  </>
                )}
                <button className="button" onClick={copyJson}>
                  Copiar JSON
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
