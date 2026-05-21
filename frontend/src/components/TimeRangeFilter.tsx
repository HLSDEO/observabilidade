import React, { useState } from 'react';
import { subHours, subDays, startOfDay, endOfDay } from 'date-fns';

interface TimeRangeFilterProps {
  onRangeChange: (from: Date, to: Date) => void;
}

export const TimeRangeFilter: React.FC<TimeRangeFilterProps> = ({ onRangeChange }) => {
  const [rangeType, setRangeType] = useState<'24h' | '7d' | '30d' | 'custom'>('24h');
  const [customFrom, setCustomFrom] = useState<string>('');
  const [customTo, setCustomTo] = useState<string>('');

  const handleRangeChange = (type: string) => {
    setRangeType(type as any);
    const now = new Date();
    let from: Date;

    switch (type) {
      case '24h':
        from = subHours(now, 24);
        break;
      case '7d':
        from = subDays(now, 7);
        break;
      case '30d':
        from = subDays(now, 30);
        break;
      default:
        return;
    }

    onRangeChange(from, now);
  };

  const handleCustomRange = () => {
    if (customFrom && customTo) {
      onRangeChange(new Date(customFrom), new Date(customTo));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Período
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => handleRangeChange('24h')}
              className={`px-4 py-2 rounded ${
                rangeType === '24h'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              24h
            </button>
            <button
              onClick={() => handleRangeChange('7d')}
              className={`px-4 py-2 rounded ${
                rangeType === '7d'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              7 dias
            </button>
            <button
              onClick={() => handleRangeChange('30d')}
              className={`px-4 py-2 rounded ${
                rangeType === '30d'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              30 dias
            </button>
            <button
              onClick={() => setRangeType('custom')}
              className={`px-4 py-2 rounded ${
                rangeType === 'custom'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              Customizado
            </button>
          </div>
        </div>

        {rangeType === 'custom' && (
          <div className="flex gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                De
              </label>
              <input
                type="datetime-local"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Até
              </label>
              <input
                type="datetime-local"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="input-field"
              />
            </div>
            <button
              onClick={handleCustomRange}
              className="btn-primary"
            >
              Aplicar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
