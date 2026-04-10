import React, { useContext } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import { 
  BarChart as ReBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel p-3 border border-col backdrop-blur-md shadow-2xl">
        <p className="text-xs text-sec mb-1 font-mono uppercase tracking-wider font-semibold capitalize">{label}</p>
        <div className="space-y-1">
          <p className="text-sm font-bold text-main">
            {payload[0].value} <span className="text-xs text-sec font-normal">Reviews</span>
          </p>
          <p className="text-xs text-red-400 font-medium font-mono uppercase">
             · {payload[0].payload.bugs} bugs found
          </p>
        </div>
      </div>
    );
  }
  return null;
};

const BarChart = ({ data }) => {
  const { theme } = useContext(ThemeContext);
  const gridColor = theme === 'dark' ? '#1e293b' : '#e2e8f0';
  const tickColor = theme === 'dark' ? '#64748b' : '#94a3b8';
  const labelColor = theme === 'dark' ? '#e2e8f0' : '#0f172a';
  const cursorColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';

  const colors = {
    javascript: '#f59e0b',
    python: '#3b82f6',
    typescript: '#2563eb',
    java: '#ef4444',
    cpp: '#8b5cf6',
    go: '#06b6d4',
  };

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%" minHeight={320} debounce={50}>
        <ReBarChart
          layout="vertical"
          data={data}
          margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            horizontal={true} 
            vertical={false} 
            stroke={gridColor} 
          />
          <XAxis 
            type="number" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: tickColor, fontSize: 10 }}
          />
          <YAxis 
            dataKey="_id" 
            type="category" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: labelColor, fontSize: 11, fontWeight: 'bold' }}
            width={80}
            className="capitalize"
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: cursorColor }} />
          <Bar
            dataKey="count"
            radius={[0, 4, 4, 0]}
            barSize={20}
            animationDuration={1500}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={colors[entry._id] || '#64748b'} 
                fillOpacity={0.8}
                className="transition-all hover:filter hover:brightness-125"
              />
            ))}
          </Bar>
        </ReBarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BarChart;
