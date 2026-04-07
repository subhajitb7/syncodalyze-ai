import React from 'react';
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
      <div className="glass-panel p-3 border border-dark-600 backdrop-blur-md shadow-2xl">
        <p className="text-xs text-gray-400 mb-1 font-mono uppercase tracking-wider font-semibold capitalize">{label}</p>
        <div className="space-y-1">
          <p className="text-sm font-bold text-white">
            {payload[0].value} <span className="text-xs text-gray-400 font-normal">Reviews</span>
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
  const colors = {
    javascript: '#f59e0b',
    python: '#3b82f6',
    typescript: '#2563eb',
    java: '#ef4444',
    cpp: '#8b5cf6',
    go: '#06b6d4',
  };

  return (
    <div className="w-full h-full min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <ReBarChart
          layout="vertical"
          data={data}
          margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            horizontal={true} 
            vertical={false} 
            stroke="#1e293b" 
          />
          <XAxis 
            type="number" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 10 }}
          />
          <YAxis 
            dataKey="_id" 
            type="category" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#e2e8f0', fontSize: 11, fontWeight: 'bold' }}
            width={80}
            className="capitalize"
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
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
