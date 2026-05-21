import React from 'react';
import {
  LineChart,
  BarChart,
  PieChart,
  Line,
  Bar,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { CardConfig, AggregationResult } from '../types';

interface ChartRendererProps {
  type: string;
  data: AggregationResult[];
  config: CardConfig;
  onDataPointClick?: (value: any) => void;
}

const COLORS = [
  '#3b82f6',
  '#ef4444',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#f97316',
];

export const ChartRenderer: React.FC<ChartRendererProps> = ({
  type,
  data,
  config,
  onDataPointClick,
}) => {
  const handleClick = (entry: any) => {
    if (onDataPointClick) {
      onDataPointClick(entry);
    }
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded">
        <p className="text-gray-500">Nenhum dado disponível</p>
      </div>
    );
  }

  switch (type) {
    case 'line':
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={Object.keys(data[0])?.[0]} />
            <YAxis />
            <Tooltip />
            <Legend />
            {Object.keys(data[0])
              .filter((key) => key !== Object.keys(data[0])[0])
              .map((key) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke="#3b82f6"
                  connectNulls
                />
              ))}
          </LineChart>
        </ResponsiveContainer>
      );

    case 'bar':
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} onClick={(state) => handleClick(state.activeTooltipIndex ? data[state.activeTooltipIndex] : null)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={Object.keys(data[0])?.[0]} />
            <YAxis />
            <Tooltip />
            <Legend />
            {Object.keys(data[0])
              .filter((key) => key !== Object.keys(data[0])[0])
              .map((key) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill="#3b82f6"
                  onClick={handleClick}
                />
              ))}
          </BarChart>
        </ResponsiveContainer>
      );

    case 'pie':
      const pieData = data.map((item, idx) => ({
        ...item,
        name: item[Object.keys(item)[0]],
        value: item[Object.keys(item)[1]] || 0,
      }));

      return (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
              onClick={handleClick}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      );

    case 'gauge':
      const value = data[0]?.count || data[0]?.sum || 0;
      const percentage = ((value / (config.max || 100)) * 100).toFixed(0);

      return (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-5xl font-bold text-blue-600">{value}</div>
          <div className="text-gray-600 mt-2">{config.title}</div>
          <div className="w-full mt-4 bg-gray-200 rounded-full h-4">
            <div
              className="bg-blue-600 h-4 rounded-full"
              style={{ width: `${Math.min(percentage, 100)}%` }}
            ></div>
          </div>
        </div>
      );

    default:
      return (
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded">
          <p className="text-gray-500">Tipo de gráfico não suportado: {type}</p>
        </div>
      );
  }
};
