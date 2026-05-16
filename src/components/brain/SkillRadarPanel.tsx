import React, { useMemo } from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, Brain } from 'lucide-react';
import { useBrainStore } from '../../store/useBrainStore';
import { useProgressStore } from '../../store/useProgressStore';

function topicScore(topicId: string): number {
  const progress = useProgressStore.getState();
  const t = progress.topics[topicId];
  if (!t) return 0;
  const total = t.level1.total + t.level2.total + t.level3.total;
  if (total === 0) return 0;
  const solved = t.level1.solved + t.level2.solved + t.level3.solved;
  return Math.round((solved / total) * 100);
}

const RADAR_TOPICS = [
  { key: 'arrays',        label: 'Arrays' },
  { key: 'dp',            label: 'DP' },
  { key: 'graph',         label: 'Graph' },
  { key: 'stack',         label: 'Stack' },
  { key: 'binary-search', label: 'Bin Search' },
  { key: 'hashmap',       label: 'HashMap' },
  { key: 'tree',          label: 'Tree' },
  { key: 'recursion',     label: 'Recursion' },
];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const { subject, value } = payload[0].payload;
  return (
    <div className="bg-surface border border-border rounded-lg px-3 py-2 text-xs shadow-xl">
      <div className="font-bold text-primary">{subject}</div>
      <div className="text-violet-400 font-mono">{value}%</div>
    </div>
  );
};

export const SkillRadarPanel: React.FC = () => {
  const { sessions, skillScores } = useBrainStore();
  const { topics } = useProgressStore();

  const data = useMemo(() =>
    RADAR_TOPICS.map(({ key, label }) => {
      const progressScore = topicScore(key);
      const brainScore = skillScores[key]?.masteryScore ?? 0;
      const combined = Math.round(progressScore * 0.6 + brainScore * 0.4);
      return { subject: label, value: combined, fullMark: 100 };
    }),
    [topics, skillScores]
  );

  const sorted = [...data].sort((a, b) => b.value - a.value);
  const topStrong = sorted.slice(0, 3);
  const topWeak = sorted.slice(-3).reverse();

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-48 h-48 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
          <Brain size={16} className="text-violet-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-primary">Skill Radar</h3>
          <p className="text-[10px] text-muted">Topic mastery across all domains</p>
        </div>
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
            <PolarGrid stroke="rgba(255,255,255,0.06)" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: '#888', fontSize: 10, fontWeight: 600 }}
            />
            <Radar
              name="Skill"
              dataKey="value"
              stroke="#8b5cf6"
              fill="#8b5cf6"
              fillOpacity={0.25}
              strokeWidth={2}
            />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-green-400 uppercase tracking-widest mb-2">
            <TrendingUp size={10} /> Strong
          </div>
          <div className="space-y-1.5">
            {topStrong.map(t => (
              <div key={t.subject} className="flex items-center justify-between">
                <span className="text-xs text-muted">{t.subject}</span>
                <div className="flex items-center gap-1.5">
                  <div className="h-1 w-12 bg-border rounded-full overflow-hidden">
                    <div className="h-full bg-green-400 rounded-full transition-all" style={{ width: `${t.value}%` }} />
                  </div>
                  <span className="text-[10px] font-mono text-green-400">{t.value}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-2">
            <TrendingDown size={10} /> Needs Work
          </div>
          <div className="space-y-1.5">
            {topWeak.map(t => (
              <div key={t.subject} className="flex items-center justify-between">
                <span className="text-xs text-muted">{t.subject}</span>
                <div className="flex items-center gap-1.5">
                  <div className="h-1 w-12 bg-border rounded-full overflow-hidden">
                    <div className="h-full bg-rose-400 rounded-full transition-all" style={{ width: `${t.value}%` }} />
                  </div>
                  <span className="text-[10px] font-mono text-rose-400">{t.value}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {sessions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border/50 text-[10px] text-muted text-center">
          Based on {sessions.length} Brain session{sessions.length !== 1 ? 's' : ''} + curriculum progress
        </div>
      )}
    </div>
  );
};
