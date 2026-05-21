import React from 'react';

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-blue-600 mb-4">
        Observabilidade - Logs e Dashboards
      </h1>
      <p className="text-gray-700 text-lg mb-8">
        Aplicação FastAPI + React para receber, armazenar e visualizar logs com dashboards personalizados
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">✓ Backend</h2>
          <p className="text-gray-700">FastAPI com PostgreSQL</p>
          <a href="http://localhost:8000/docs" className="text-blue-600 hover:underline mt-2 inline-block">
            API Swagger →
          </a>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">✓ Frontend</h2>
          <p className="text-gray-700">React com TypeScript</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">✓ Banco de Dados</h2>
          <p className="text-gray-700">PostgreSQL na porta 5432</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Próximos Passos</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Vá para <a href="/dashboards" className="text-blue-600 hover:underline">Dashboards</a> para criar um novo dashboard</li>
          <li>Use o endpoint <code className="bg-gray-100 px-2 py-1 rounded">POST /api/logs</code> para enviar logs</li>
          <li>Visualize os dados no dashboard com gráficos interativos</li>
          <li>Clique nos gráficos para ver os detalhes completos dos logs</li>
        </ol>
      </div>
    </div>
  );
}
