import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useProgressStore } from '../../store/useProgressStore';

export const LevelBreakdownChart: React.FC = () => {
  const { topics } = useProgressStore();

  const stats = Object.values(topics).reduce(
    (acc, topic) => {
      acc.level1 += topic.level1.solved;
      acc.level2 += topic.level2.solved;
      acc.level3 += topic.level3.solved;
      return acc;
    },
    { level1: 0, level2: 0, level3: 0 }
  );

  const data = [
    { name: 'Level 1', solved: stats.level1, fill: '#4ADE80' },
    { name: 'Level 2', solved: stats.level2, fill: '#FACC15' },
    { name: 'Level 3', solved: stats.level3, fill: '#7C6FF7' },
  ];

  return (
    <div className="bg-surface border border-border rounded-xl p-6 h-full">
      <h3 className="text-lg font-bold text-primary mb-6">Difficulty Breakdown</h3>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: -20, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis 
              dataKey="name" 
              type="category" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#6B6B7B', fontSize: 12 }} 
            />
            <Tooltip 
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              contentStyle={{ backgroundColor: '#141416', border: '1px solid #2A2A2E', borderRadius: '8px' }}
              itemStyle={{ color: '#E8E8F0', fontSize: '12px' }}
            />
            <Bar dataKey="solved" radius={[0, 4, 4, 0]} barSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
