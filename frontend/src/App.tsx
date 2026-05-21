import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import DashboardEditor from './pages/DashboardEditor';
import DashboardViewer from './pages/DashboardViewer';
import DockerManager from './pages/DockerManager';
import './styles/index.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <Link to="/" className="text-2xl font-bold text-blue-600">
                📊 Observabilidade
              </Link>
              <div className="space-x-4">
                <Link
                  to="/"
                  className="px-4 py-2 text-gray-700 hover:text-blue-600 font-medium"
                >
                  Meus Dashboards
                </Link>
                <Link
                  to="/docker"
                  className="px-4 py-2 text-gray-700 hover:text-blue-600 font-medium"
                >
                  🐳 Docker Manager
                </Link>
              </div>
            </div>
          </nav>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<DashboardEditor />} />
            <Route path="/dashboard/:id" element={<DashboardViewer />} />
            <Route path="/docker" element={<DockerManager />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
