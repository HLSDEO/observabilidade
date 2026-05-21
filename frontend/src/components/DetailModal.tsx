import React, { useState } from 'react';
import { Log, QueryDetailsResponse } from '../types';

interface DetailModalProps {
  isOpen: boolean;
  data: QueryDetailsResponse | null;
  onClose: () => void;
  onLoadMore?: () => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({
  isOpen,
  data,
  onClose,
  onLoadMore,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (log: Log) => {
    const json = JSON.stringify(log, null, 2);
    navigator.clipboard.writeText(json);
    setCopiedId(log.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen || !data) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content w-11/12 max-h-screen overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Detalhes dos Logs</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {data.data.length === 0 ? (
          <p className="text-gray-500 py-8">Nenhum log encontrado</p>
        ) : (
          <>
            <div className="table-container">
              <table className="table text-sm">
                <thead className="table-header">
                  <tr>
                    <th className="table-cell">Data/Hora Início</th>
                    <th className="table-cell">Tipo</th>
                    <th className="table-cell">Identificador</th>
                    <th className="table-cell">Dados</th>
                    <th className="table-cell">Status</th>
                    <th className="table-cell">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((log) => (
                    <tr key={log.id} className="table-row">
                      <td className="table-cell">
                        {new Date(log.start_time).toLocaleString()}
                      </td>
                      <td className="table-cell">
                        <span
                          className={`px-2 py-1 rounded text-white text-xs font-semibold ${
                            log.type === 'error'
                              ? 'bg-red-600'
                              : log.type === 'success'
                              ? 'bg-green-600'
                              : log.type === 'warning'
                              ? 'bg-yellow-600'
                              : 'bg-blue-600'
                          }`}
                        >
                          {log.type}
                        </span>
                      </td>
                      <td className="table-cell">{log.identifier}</td>
                      <td className="table-cell max-w-xs truncate">{log.data}</td>
                      <td className="table-cell">{log.status_code || '-'}</td>
                      <td className="table-cell">
                        <button
                          onClick={() => copyToClipboard(log)}
                          className={`text-xs px-2 py-1 rounded transition ${
                            copiedId === log.id
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                          }`}
                        >
                          {copiedId === log.id ? '✓ Copiado' : 'Copiar JSON'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data.offset + data.limit < data.total && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={onLoadMore}
                  className="btn-secondary"
                >
                  Carregar mais ({data.offset + data.limit} de {data.total})
                </button>
              </div>
            )}

            <div className="mt-4 text-sm text-gray-600 text-center">
              Mostrando {data.data.length} de {data.total} registros
            </div>
          </>
        )}
      </div>
    </div>
  );
};
