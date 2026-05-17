import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useProgressStore } from '../../store/useProgressStore';

const COLORS = ['#7C6FF7', '#4ADE80', '#FACC15', '#F87171', '#38BDF8', '#FB923C', '#A78BFA', '#2DD4BF'];

export const PatternDistributionChart: React.FC = () => {
  const { topics } = useProgressStore();

  const data = React.useMemo(() => {
    const allPatterns: Record<string, number> = {};
    Object.values(topics).forEach(topic => {
      Object.entries(topic.patternStats || {}).forEach(([pattern, count]) => {
        allPatterns[pattern] = (allPatterns[pattern] || 0) + count;
      });
    });

    return Object.entries(allPatterns)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 patterns
  }, [topics]);

  if (data.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-6 h-full flex flex-col items-center justify-center text-center">
        <h3 className="text-lg font-bold text-primary mb-2 w-full text-left">Pattern Distribution</h3>
        <div className="flex-1 flex flex-col items-center justify-center text-muted border border-dashed border-border rounded-lg bg-background/50 w-full">
          <p className="text-sm px-4">Solve problems using specific patterns to see your distribution here!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-6 h-full flex flex-col">
      <h3 className="text-lg font-bold text-primary mb-4">Pattern Distribution</h3>
      <div className="flex-1 min-h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: '#141416', border: '1px solid #2A2A2E', borderRadius: '8px' }}
              itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
            />
            <Legend 
              layout="horizontal" 
              verticalAlign="bottom" 
              align="center"
              iconType="circle"
              wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
