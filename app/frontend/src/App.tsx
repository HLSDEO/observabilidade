import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  useLocation,
} from 'react-router-dom';
import DashboardEditor from './pages/DashboardEditor';
import DashboardViewer from './pages/DashboardViewer';
import Home from './pages/Home';
import './App.css';

const NAV_ITEMS = [
  { to: '/', label: 'Visão geral', icon: '◎', end: true },
  { to: '/dashboards', label: 'Dashboards', icon: '▦', end: false },
];

const DATA_SOURCES: [string, string][] = [
  ['logs', 'Logs'],
  ['postgres', 'PostgreSQL'],
  ['api', 'FastAPI'],
];

function topbarTitle(pathname: string): string {
  if (pathname.startsWith('/dashboard/')) return 'Visualizar dashboard';
  if (pathname.startsWith('/dashboards')) return 'Dashboards';
  return 'Visão geral';
}

function Shell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="logo">
          <NavLink to="/">
            <div className="logo-mark">
              OBS<span>.</span>
            </div>
            <div className="logo-sub">Observabilidade</div>
          </NavLink>
        </div>
        <nav className="nav">
          <section className="nav-section">
            <div className="nav-label">Navegação</div>
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `nav-item ${isActive ? 'active' : ''}`
                }
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </section>
          <section className="nav-section">
            <div className="nav-label">Fontes de dados</div>
            {DATA_SOURCES.map(([key, label]) => (
              <div key={key} className="nav-item data-source">
                <span className="nav-icon">•</span>
                <span>{label}</span>
              </div>
            ))}
          </section>
        </nav>
        <div className="sidebar-footer">
          <div>frontend: localhost:3000</div>
          <div>api: localhost:8000</div>
          <div>postgres: localhost:5432</div>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div className="topbar-title">{topbarTitle(location.pathname)}</div>
          <div className="topbar-actions">
            <a
              className="topbar-link"
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noreferrer"
            >
              API Docs
            </a>
          </div>
        </header>
        <div className="content">{children}</div>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Shell>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboards" element={<DashboardEditor />} />
          <Route path="/dashboard/:id" element={<DashboardViewer />} />
        </Routes>
      </Shell>
    </Router>
  );
}

export default App;
