import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import DashboardEditor from './pages/DashboardEditor';
import DashboardViewer from './pages/DashboardViewer';
import Home from './pages/Home';
import './App.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <Link to="/" className="text-2xl font-bold text-blue-600">
                📊 Observabilidade
              </Link>
              <div className="space-x-4">
                <Link to="/" className="text-gray-700 hover:text-blue-600">
                  Início
                </Link>
                <Link to="/dashboards" className="text-gray-700 hover:text-blue-600">
                  Dashboards
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboards" element={<DashboardEditor />} />
          <Route path="/dashboard/:id" element={<DashboardViewer />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
