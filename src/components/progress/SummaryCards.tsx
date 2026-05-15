import React from 'react';
import { Target, Trophy, Flame, CheckCircle2 } from 'lucide-react';
import { useProgressStore } from '../../store/useProgressStore';

export const SummaryCards: React.FC = () => {
  const { points, currentStreak, topics, solvedProblems } = useProgressStore();

  const totalProblemsSolved = solvedProblems.length;

  const topicsMastered = Object.values(topics).filter(t => t.fullyCompleted).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500 shrink-0 border border-yellow-500/20">
          <Trophy size={20} />
        </div>
        <div>
          <div className="text-2xl font-bold font-mono">{points}</div>
          <div className="text-xs text-muted uppercase tracking-wider font-semibold">Total Points</div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0 border border-blue-500/20">
          <Target size={20} />
        </div>
        <div>
          <div className="text-2xl font-bold font-mono">{totalProblemsSolved}</div>
          <div className="text-xs text-muted uppercase tracking-wider font-semibold">Problems Solved</div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0 border border-orange-500/20">
          <Flame size={20} />
        </div>
        <div>
          <div className="text-2xl font-bold font-mono">{currentStreak} <span className="text-sm font-sans text-muted font-normal">days</span></div>
          <div className="text-xs text-muted uppercase tracking-wider font-semibold">Current Streak</div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent shrink-0 border border-accent/20">
          <CheckCircle2 size={20} />
        </div>
        <div>
          <div className="text-2xl font-bold font-mono">{topicsMastered}</div>
          <div className="text-xs text-muted uppercase tracking-wider font-semibold">Topics Mastered</div>
        </div>
      </div>
    </div>
  );
};
