import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-4xl font-bold text-blue-600 mb-4">
        📊 Observabilidade - Em Desenvolvimento
      </h1>
      <p className="text-gray-700 text-lg mb-4">
        Aplicação FastAPI + React para Dashboard de Logs
      </p>
      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Status</h2>
        <ul className="space-y-2 text-gray-700">
          <li>✓ Backend rodando em http://localhost:8000</li>
          <li>✓ Frontend rodando em http://localhost:3000</li>
          <li>✓ PostgreSQL rodando em localhost:5432</li>
          <li>→ Documentação: http://localhost:8000/docs</li>
        </ul>
      </div>
    </div>
  );
}

export default App;
