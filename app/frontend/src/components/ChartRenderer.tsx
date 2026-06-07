import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface Props {
  type: 'line' | 'bar' | 'pie' | 'gauge' | 'table';
  data: any[];
  config: any;
  onDataPointClick: (value: any) => void;
}

// Paleta alinhada ao design system
const COLORS = [
  '#00e5ff', // accent (cyan)
  '#ff6b35', // accent2 (orange)
  '#00ff94', // green
  '#ffd60a', // yellow
  '#b48ead', // purple
  '#4c82f7', // blue
  '#ff3860', // red
  '#2dd4bf', // teal
  '#f472b6', // pink
  '#a3e635', // lime
];

const AXIS_COLOR = '#7b8797';
const GRID_COLOR = '#1f2730';

const tooltipStyle = {
  background: '#12171d',
  border: '1px solid #2a3540',
  borderRadius: 6,
  color: '#e2e8f0',
  fontSize: 12,
};

export default function ChartRenderer({ type, data, config, onDataPointClick }: Props) {
  if (!data || data.length === 0) {
    return <div className="empty-state">Sem dados para exibir</div>;
  }

  const handleClick = (value: any) => onDataPointClick(value);
  const xKey = config.axes?.x?.key || Object.keys(data[0])[0];
  const yKey = config.axes?.y?.key || Object.keys(data[0])[1];

  switch (type) {
    case 'line':
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: -8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
            <XAxis dataKey={xKey} stroke={AXIS_COLOR} tick={{ fontSize: 11 }} />
            <YAxis stroke={AXIS_COLOR} tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: '#2a3540' }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey={yKey}
              stroke={COLORS[0]}
              strokeWidth={2}
              dot={{ r: 3, fill: COLORS[0] }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      );

    case 'bar': {
      const handleBarChartClick = (state: any) => {
        const payload = state?.activePayload?.[0]?.payload;
        if (payload) handleClick(payload);
      };
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            margin={{ top: 8, right: 16, bottom: 4, left: -8 }}
            onClick={handleBarChartClick}
            style={{ cursor: 'pointer' }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
            <XAxis dataKey={xKey} stroke={AXIS_COLOR} tick={{ fontSize: 11 }} />
            <YAxis stroke={AXIS_COLOR} tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(0,229,255,0.06)' }} />
            <Bar dataKey={yKey} radius={[4, 4, 0, 0]}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    }

    case 'pie':
      return (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              dataKey={yKey}
              nameKey={xKey}
              cx="50%"
              cy="50%"
              outerRadius={90}
              innerRadius={45}
              paddingAngle={2}
              stroke="#0a0c0f"
              label={{ fill: '#e2e8f0', fontSize: 11 }}
              onClick={(entry: any) => handleClick(entry.payload)}
              cursor="pointer"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      );

    case 'gauge': {
      const gaugeValue = typeof data === 'number' ? data : data[0]?.count || 0;
      const max = config.max || 1000;
      const percentage = Math.min((gaugeValue / max) * 100, 100);
      const arc = (percentage / 100) * 126; // semicircle length approx
      const color =
        percentage < 50 ? '#00ff94' : percentage < 80 ? '#ffd60a' : '#ff3860';
      return (
        <div className="gauge-wrap">
          <svg viewBox="0 0 100 55" width="200">
            <path
              d="M 8 50 A 42 42 0 0 1 92 50"
              fill="none"
              stroke="#1f2730"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <path
              d="M 8 50 A 42 42 0 0 1 92 50"
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${arc} 200`}
            />
          </svg>
          <div className="gauge-value">{gaugeValue.toLocaleString('pt-BR')}</div>
          <div className="muted mono" style={{ fontSize: 11, marginTop: 6 }}>
            máx {max.toLocaleString('pt-BR')}
          </div>
        </div>
      );
    }

    case 'table':
      return (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {Object.keys(data[0] || {}).map((key) => (
                  <th key={key}>{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr
                  key={idx}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleClick(row)}
                >
                  {Object.values(row).map((value: any, i) => (
                    <td key={i}>{String(value)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    default:
      return <div className="empty-state">Tipo de gráfico não suportado: {type}</div>;
  }
}
