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

// Cores vibrantes similar ao Grafana
const COLORS = [
  '#00B050', // Verde
  '#FF0000', // Vermelho
  '#0070C0', // Azul
  '#FFC000', // Amarelo/Ouro
  '#92278F', // Roxo
  '#00B0F0', // Cyan
  '#FF6B6B', // Vermelho claro
  '#4ECDC4', // Teal
  '#45B7D1', // Azul claro
  '#FFA07A', // Salmão
];

export default function ChartRenderer({ type, data, config, onDataPointClick }: Props) {
  if (!data || data.length === 0) {
    return <div className="text-gray-500 text-center py-8">Sem dados para exibir</div>;
  }

  const handleClick = (value: any) => {
    onDataPointClick(value);
  };

  switch (type) {
    case 'line':
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={config.axes?.x?.key || Object.keys(data[0])[0]} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey={config.axes?.y?.key || Object.keys(data[0])[1]} stroke="#0088FE" />
          </LineChart>
        </ResponsiveContainer>
      );

    case 'bar':
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={config.axes?.x?.key || Object.keys(data[0])[0]} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar
              dataKey={config.axes?.y?.key || Object.keys(data[0])[1]}
              fill="#0088FE"
              onClick={handleClick}
            />
          </BarChart>
        </ResponsiveContainer>
      );

    case 'pie':
      return (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              dataKey={config.axes?.y?.key || Object.keys(data[0])[1]}
              nameKey={config.axes?.x?.key || Object.keys(data[0])[0]}
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
              onClick={(entry) => handleClick(entry.payload)}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      );

    case 'gauge':
      const gaugeValue = typeof data === 'number' ? data : data[0]?.count || 0;
      const max = config.max || 1000;
      const percentage = (gaugeValue / max) * 100;
      return (
        <div className="text-center">
          <div className="relative w-40 h-40 mx-auto">
            <svg viewBox="0 0 100 60" className="w-full">
              <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="5"
              />
              <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke={percentage < 50 ? '#22c55e' : percentage < 80 ? '#eab308' : '#ef4444'}
                strokeWidth="5"
                strokeDasharray={`${(percentage / 100) * 251.2} 251.2`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold">{gaugeValue}</span>
            </div>
          </div>
        </div>
      );

    case 'table':
      return (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                {Object.keys(data[0] || {}).map((key) => (
                  <th key={key} className="border border-gray-300 px-4 py-2 text-left">
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleClick(row)}>
                  {Object.values(row).map((value: any, idx) => (
                    <td key={idx} className="border border-gray-300 px-4 py-2">
                      {String(value)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    default:
      return <div className="text-gray-500">Tipo de gráfico não suportado: {type}</div>;
  }
}
