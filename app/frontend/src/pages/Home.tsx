import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../services/api';

const FEATURES: [string, string, string][] = [
  ['Dashboards', 'Crie painéis com múltiplos gráficos configuráveis via JSON.', '▦'],
  ['Gráficos interativos', 'Linha, barra, pizza, gauge e tabelas.', '▤'],
  ['Detalhe de logs', 'Clique em um ponto do gráfico para ver os logs completos.', '◉'],
  ['Auto-refresh', 'Atualização automática configurável por dashboard.', '↻'],
  ['Filtros de período', 'Últimas 24h, 7d, 30d ou intervalo customizado.', '⧖'],
  ['Agregações', 'count, sum, avg, min, max e distinct.', 'Σ'],
];

export default function Home() {
  const navigate = useNavigate();
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    dashboardService
      .list()
      .then((res) => setCount(res.data.length))
      .catch(() => setCount(null));
  }, []);

  return (
    <div>
      <div className="page-header">
        <div className="page-label">Plataforma de observabilidade</div>
        <div className="page-title">Logs e dashboards em tempo real</div>
        <div className="page-subtitle">
          Receba, armazene e visualize logs estruturados com dashboards
          personalizados e gráficos interativos.
        </div>
      </div>

      <div className="grid-3">
        <div className="stat-card accent">
          <div className="stat-label">Dashboards</div>
          <div className="stat-value">{count === null ? '–' : count}</div>
          <div className="stat-sub">painéis configurados</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Backend</div>
          <div className="stat-value" style={{ fontSize: 20, marginTop: 12 }}>
            FastAPI
          </div>
          <div className="stat-sub">API + PostgreSQL</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-label">Frontend</div>
          <div className="stat-value" style={{ fontSize: 20, marginTop: 12 }}>
            React + TS
          </div>
          <div className="stat-sub">interface responsiva</div>
        </div>
      </div>

      <div className="card section-gap">
        <div className="card-title">Recursos</div>
        <div className="grid-3">
          {FEATURES.map(([title, desc, icon]) => (
            <div key={title} className="feature">
              <div className="feature-icon">{icon}</div>
              <div>
                <div className="feature-title">{title}</div>
                <div className="muted feature-desc">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card section-gap">
        <div className="card-head">
          <div className="card-title">Primeiros passos</div>
          <button className="button" onClick={() => navigate('/dashboards')}>
            Ir para dashboards →
          </button>
        </div>
        <ol className="steps">
          <li>
            <span className="step-num">1</span>
            <span>
              Acesse <strong>Dashboards</strong> e crie um novo painel.
            </span>
          </li>
          <li>
            <span className="step-num">2</span>
            <span>
              Envie logs via <code className="mono">POST /api/logs</code>.
            </span>
          </li>
          <li>
            <span className="step-num">3</span>
            <span>Abra o dashboard e explore os gráficos interativos.</span>
          </li>
          <li>
            <span className="step-num">4</span>
            <span>Clique em um gráfico para detalhar os logs completos.</span>
          </li>
        </ol>
      </div>
    </div>
  );
}
