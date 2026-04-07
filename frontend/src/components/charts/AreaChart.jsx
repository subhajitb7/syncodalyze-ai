import React from 'react';
import { 
  AreaChart as ReAreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel p-3 border border-primary-500/30 backdrop-blur-md shadow-2xl shadow-primary-500/20">
        <p className="text-xs text-gray-400 mb-1 font-mono uppercase tracking-wider">{label}</p>
        <p className="text-lg font-bold text-white leading-none">
          {payload[0].value} <span className="text-xs text-primary-400 font-normal">Reviews</span>
        </p>
        {payload[0].payload.bugs !== undefined && (
          <p className="text-sm text-red-400 mt-1 font-medium">
             · {payload[0].payload.bugs} bugs found
          </p>
        )}
      </div>
    );
  }
  return null;
};

const AreaChart = ({ data, color = "#3b82f6", gradientId = "colorPv" }) => {
  return (
    <div className="w-full h-full min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <ReAreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.4}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            vertical={false} 
            stroke="#1e293b" 
          />
          <XAxis 
            dataKey="_id" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 10 }}
            dy={10}
            tickFormatter={(val) => val.slice(5) || val} // Formats YYYY-MM-DD
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 10 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="count"
            stroke={color}
            strokeWidth={3}
            fillOpacity={1}
            fill={`url(#${gradientId})`}
            animationDuration={1500}
            dot={{ r: 4, fill: color, strokeWidth: 2, stroke: '#000' }}
            activeDot={{ r: 6, strokeWidth: 0, className: "shadow-lg shadow-white" }}
          />
        </ReAreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AreaChart;
