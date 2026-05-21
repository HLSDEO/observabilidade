import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Container {
  id: string;
  name: string;
  image: string;
  status: string;
  state: string;
  ports: string;
}

interface Service {
  name: string;
  service: string;
  status: string;
  ports: string;
}

const DockerManager: React.FC = () => {
  const [containers, setContainers] = useState<Container[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
  const [logs, setLogs] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'containers' | 'services' | 'logs'>('containers');
  const [actionMessage, setActionMessage] = useState<string>('');

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

  useEffect(() => {
    loadContainers();
    loadServices();
    const interval = setInterval(() => {
      loadContainers();
      loadServices();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadContainers = async () => {
    try {
      const response = await axios.get(`${API_BASE}/docker/containers`);
      setContainers(response.data.containers);
    } catch (error) {
      console.error('Error loading containers:', error);
    }
  };

  const loadServices = async () => {
    try {
      const response = await axios.get(`${API_BASE}/docker/compose/services`);
      setServices(response.data.services);
    } catch (error) {
      console.error('Error loading services:', error);
    }
  };

  const loadLogs = async (containerId: string) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/docker/container/${containerId}/logs?tail=100`);
      setLogs(response.data.logs);
    } catch (error) {
      setLogs('Error loading logs');
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContainerAction = async (containerId: string, action: 'start' | 'stop' | 'restart') => {
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/docker/container/${containerId}/${action}`);
      setActionMessage(`Container ${action}ed successfully`);
      setTimeout(() => setActionMessage(''), 3000);
      loadContainers();
    } catch (error) {
      setActionMessage(`Error: Failed to ${action} container`);
      console.error(`Error ${action}ing container:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleComposeAction = async (action: 'up' | 'down' | 'restart' | 'rebuild') => {
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/docker/compose/${action}`);
      setActionMessage(`Compose ${action} completed successfully`);
      setTimeout(() => setActionMessage(''), 3000);
      loadContainers();
      loadServices();
    } catch (error) {
      setActionMessage(`Error: Failed to ${action} services`);
      console.error(`Error ${action}ing services:`, error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status.includes('Up')) return 'bg-green-100 text-green-800';
    if (status.includes('Exited')) return 'bg-red-100 text-red-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const getStateColor = (state: string) => {
    if (state === 'running') return 'bg-green-500';
    if (state === 'exited') return 'bg-red-500';
    return 'bg-yellow-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-2">🐳 Docker Manager</h1>
        <p className="text-blue-100">Gerenciar containers e serviços do Docker Compose</p>
      </div>

      {/* Action Message */}
      {actionMessage && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
          {actionMessage}
        </div>
      )}

      {/* Compose Controls */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Docker Compose</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleComposeAction('up')}
            disabled={loading}
            className="btn-primary"
          >
            ▶️ Up (Start All)
          </button>
          <button
            onClick={() => handleComposeAction('down')}
            disabled={loading}
            className="btn-danger"
          >
            ⏹️ Down (Stop All)
          </button>
          <button
            onClick={() => handleComposeAction('restart')}
            disabled={loading}
            className="btn-secondary"
          >
            🔄 Restart
          </button>
          <button
            onClick={() => handleComposeAction('rebuild')}
            disabled={loading}
            className="btn-secondary"
          >
            🔨 Rebuild
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('containers')}
            className={`px-4 py-2 font-medium border-b-2 ${
              activeTab === 'containers'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Containers ({containers.length})
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`px-4 py-2 font-medium border-b-2 ${
              activeTab === 'services'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Services ({services.length})
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 font-medium border-b-2 ${
              activeTab === 'logs'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Logs
          </button>
        </div>
      </div>

      {/* Containers Tab */}
      {activeTab === 'containers' && (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-cell">Name</th>
                  <th className="table-cell">Image</th>
                  <th className="table-cell">Status</th>
                  <th className="table-cell">Ports</th>
                  <th className="table-cell">Actions</th>
                </tr>
              </thead>
              <tbody>
                {containers.map((container) => (
                  <tr key={container.id} className="table-row">
                    <td className="table-cell font-mono text-sm">{container.name}</td>
                    <td className="table-cell text-sm">{container.image}</td>
                    <td className="table-cell">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(container.status)}`}>
                        <span className={`inline-block w-2 h-2 mr-1 rounded-full ${getStateColor(container.state)}`}></span>
                        {container.status.split(' ').slice(0, 2).join(' ')}
                      </span>
                    </td>
                    <td className="table-cell text-sm">{container.ports || 'N/A'}</td>
                    <td className="table-cell">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedContainer(container);
                            setActiveTab('logs');
                            loadLogs(container.id);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          📋 Logs
                        </button>
                        {container.state !== 'running' && (
                          <button
                            onClick={() => handleContainerAction(container.id, 'start')}
                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                            disabled={loading}
                          >
                            ▶️
                          </button>
                        )}
                        {container.state === 'running' && (
                          <>
                            <button
                              onClick={() => handleContainerAction(container.id, 'restart')}
                              className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
                              disabled={loading}
                            >
                              🔄
                            </button>
                            <button
                              onClick={() => handleContainerAction(container.id, 'stop')}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                              disabled={loading}
                            >
                              ⏹️
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {containers.length === 0 && (
            <p className="text-gray-500 text-center py-4">Nenhum container encontrado</p>
          )}
        </div>
      )}

      {/* Services Tab */}
      {activeTab === 'services' && (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-cell">Service Name</th>
                  <th className="table-cell">Status</th>
                  <th className="table-cell">Ports</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.name} className="table-row">
                    <td className="table-cell font-mono text-sm">{service.name}</td>
                    <td className="table-cell">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                        {service.status.split(' ').slice(0, 2).join(' ')}
                      </span>
                    </td>
                    <td className="table-cell text-sm">{service.ports || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {services.length === 0 && (
            <p className="text-gray-500 text-center py-4">Nenhum serviço encontrado</p>
          )}
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="card">
          {selectedContainer ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Logs: {selectedContainer.name}</h3>
                <button
                  onClick={() => loadLogs(selectedContainer.id)}
                  disabled={loading}
                  className="btn-secondary text-sm"
                >
                  🔄 Refresh
                </button>
              </div>
              <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-sm overflow-x-auto max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap break-words">{logs || 'Loading logs...'}</pre>
              </div>
            </>
          ) : (
            <p className="text-gray-500 text-center py-4">
              Selecione um container na aba de Containers para ver os logs
            </p>
          )}
        </div>
      )}

      {/* Auto Refresh */}
      <div className="card">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={refreshInterval !== null}
            onChange={(e) => {
              if (e.target.checked) {
                setRefreshInterval(5000);
              } else {
                setRefreshInterval(null);
              }
            }}
            className="w-4 h-4"
          />
          <span className="text-gray-700">Auto-refresh a cada 5 segundos</span>
        </label>
      </div>
    </div>
  );
};

export default DockerManager;
