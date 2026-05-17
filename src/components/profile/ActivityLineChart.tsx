import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, subDays } from 'date-fns';
import { useProgressStore } from '../../store/useProgressStore';

export const ActivityLineChart: React.FC = () => {
  const { heatmap } = useProgressStore();

  const data = React.useMemo(() => {
    const items = [];
    for (let i = 13; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      items.push({
        name: format(subDays(new Date(), i), 'MMM dd'),
        count: heatmap[date] || 0,
      });
    }
    return items;
  }, [heatmap]);

  return (
    <div className="bg-surface border border-border rounded-xl p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-primary">Activity Trend</h3>
        <span className="text-[10px] font-black text-muted uppercase tracking-widest bg-white/5 px-2 py-1 rounded">Last 14 Days</span>
      </div>
      <div className="flex-1 min-h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#6B6B7B', fontSize: 10 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#6B6B7B', fontSize: 10 }} 
              allowDecimals={false}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#141416', border: '1px solid #2A2A2E', borderRadius: '8px' }}
              itemStyle={{ color: '#7C6FF7', fontSize: '12px', fontWeight: 'bold' }}
              labelStyle={{ color: '#E8E8F0', fontSize: '10px', marginBottom: '4px' }}
              cursor={{ stroke: '#7C6FF7', strokeWidth: 1, strokeDasharray: '3 3' }}
            />
            <Line 
              type="monotone" 
              dataKey="count" 
              stroke="#7C6FF7" 
              strokeWidth={3} 
              dot={{ r: 4, fill: '#7C6FF7', strokeWidth: 0 }}
              activeDot={{ r: 6, fill: '#A78BFA', strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
