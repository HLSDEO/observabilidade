import React, { useState } from 'react';

interface Props {
  isOpen: boolean;
  logs: any[];
  cardTitle: string;
  onClose: () => void;
}

export default function DetailModal({ isOpen, logs, cardTitle, onClose }: Props) {
  const [page, setPage] = useState(1);
  const itemsPerPage = 50;
  const totalPages = Math.ceil(logs.length / itemsPerPage);
  const startIdx = (page - 1) * itemsPerPage;
  const paginatedLogs = logs.slice(startIdx, startIdx + itemsPerPage);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{cardTitle} - Detalhes</h2>
          <button
            onClick={onClose}
            className="modal-close"
          >
            ×
          </button>
        </div>

        <div className="overflow-x-auto max-h-96 mb-4">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left">Hora Início</th>
                <th className="px-4 py-2 text-left">Tipo</th>
                <th className="px-4 py-2 text-left">Identificador</th>
                <th className="px-4 py-2 text-left">Dados</th>
                <th className="px-4 py-2 text-left">Ambiente</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.map((log, idx) => (
                <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-2 text-xs">
                    {new Date(log.start_time).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      log.type === 'error' ? 'bg-red-200 text-red-800' :
                      log.type === 'success' ? 'bg-green-200 text-green-800' :
                      log.type === 'warning' ? 'bg-yellow-200 text-yellow-800' :
                      'bg-blue-200 text-blue-800'
                    }`}>
                      {log.type}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs">{log.identifier}</td>
                  <td className="px-4 py-2 text-xs max-w-xs truncate">{log.data}</td>
                  <td className="px-4 py-2 text-xs">{log.environment}</td>
                  <td className="px-4 py-2 text-xs">{log.status_code || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {logs.length > itemsPerPage && (
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-700">
              Página {page} de {totalPages} ({logs.length} registros)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
              >
                Próxima
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => {
              const json = JSON.stringify(paginatedLogs, null, 2);
              navigator.clipboard.writeText(json);
              alert('Logs copiados para a área de transferência!');
            }}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Copiar JSON
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
