import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Play, ChevronRight, Lock, CheckCircle2, BookOpen, Code2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProgressStore } from '../../store/useProgressStore';
import { useProblemStore } from '../../store/useProblemStore';
import { getQuestionsForTopic, type Question } from '../../data/questionBank';

interface TopicDetailProps {
  topicId: string;
}

const LEVEL_LABELS = { 1: 'Easy', 2: 'Medium', 3: 'Hard' };
const LEVEL_COLORS = { 1: 'text-green-400', 2: 'text-yellow-400', 3: 'text-accent' };
const LEVEL_BG = { 1: 'bg-green-500/10 border-green-500/20', 2: 'bg-yellow-500/10 border-yellow-500/20', 3: 'bg-accent/10 border-accent/20' };
const LEVEL_BAR = { 1: 'bg-green-500', 2: 'bg-yellow-500', 3: 'bg-accent' };

export const TopicDetail: React.FC<TopicDetailProps> = ({ topicId }) => {
  const { topics, solvedProblems } = useProgressStore();
  const { setProblem } = useProblemStore();
  const navigate = useNavigate();
  const topic = topics[topicId];
  const [activeLevel, setActiveLevel] = useState<1 | 2 | 3>(1);

  if (!topic) return null;

  const questions = getQuestionsForTopic(topicId, activeLevel);
  const totalSolved = topic.level1.solved + topic.level2.solved + topic.level3.solved;
  const totalQuestions = topic.level1.total + topic.level2.total + topic.level3.total;
  const completionPct = totalQuestions > 0 ? Math.round((totalSolved / totalQuestions) * 100) : 0;

  const pieData = [
    { name: 'Easy', value: topic.level1.solved, color: '#4ADE80' },
    { name: 'Medium', value: topic.level2.solved, color: '#FACC15' },
    { name: 'Hard', value: topic.level3.solved, color: '#7C6FF7' },
    { name: 'Unsolved', value: Math.max(0, totalQuestions - totalSolved), color: '#1C1C22' },
  ];

  const handleSolve = (q: Question) => {
    setProblem({
      id: q.id,
      title: q.title,
      description: q.description,
      level: q.level,
      topic: q.topic,
      pattern: q.pattern,
      examples: q.examples,
      constraints: q.constraints,
      hints: q.hints,
      testCases: q.testCases.map(tc => ({ ...tc, actualOutput: '', passed: undefined })),
    });
    navigate(`/problem/${q.id}`);
  };

  const handleContinue = () => {
    // Find first unsolved question
    for (const lvl of [1, 2, 3] as const) {
      const qs = getQuestionsForTopic(topicId, lvl);
      const solved = topic[`level${lvl}` as 'level1' | 'level2' | 'level3'].solved;
      if (solved < qs.length) {
        const next = qs[solved];
        if (next) { handleSolve(next); return; }
      }
    }
    // All done — open first question
    const first = getQuestionsForTopic(topicId)[0];
    if (first) handleSolve(first);
  };

  const getLevelStats = (lvl: 1 | 2 | 3) => {
    const key = `level${lvl}` as 'level1' | 'level2' | 'level3';
    return topic[key];
  };

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-primary">{topic.name}</h2>
              {topic.fullyCompleted && (
                <span className="flex items-center gap-1 text-xs bg-accent/10 border border-accent/20 text-accent px-2 py-0.5 rounded-full font-semibold">
                  <CheckCircle2 size={11} /> Mastered
                </span>
              )}
            </div>
            <p className="text-muted text-sm mb-1">
              {topic.lastAttempted
                ? `Last active: ${new Date(topic.lastAttempted).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                : 'Not started yet'}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {topic.patterns.slice(0, 4).map((p, i) => (
                <span key={i} className="px-2 py-0.5 bg-background border border-border rounded text-[10px] text-muted">{p}</span>
              ))}
              {topic.patterns.length > 4 && (
                <span className="text-[10px] text-muted">+{topic.patterns.length - 4} more</span>
              )}
            </div>
          </div>

          {/* Donut chart */}
          <div className="relative w-28 h-28 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={54} paddingAngle={2} dataKey="value" stroke="none">
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#141416', border: '1px solid #2A2A2E', borderRadius: '8px', fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-lg font-bold font-mono text-primary">{completionPct}%</span>
              <span className="text-[9px] text-muted">done</span>
            </div>
          </div>
        </div>

        {/* Level progress bars */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {([1, 2, 3] as const).map(lvl => {
            const stats = getLevelStats(lvl);
            const pct = stats.total > 0 ? (stats.solved / stats.total) * 100 : 0;
            return (
              <div key={lvl} className={`p-3 rounded-lg border ${LEVEL_BG[lvl]} cursor-pointer hover:opacity-80 transition-opacity ${activeLevel === lvl ? 'ring-1 ring-inset ring-current' : ''}`}
                onClick={() => setActiveLevel(lvl)}>
                <div className={`text-xs font-bold ${LEVEL_COLORS[lvl]} mb-1`}>L{lvl} — {LEVEL_LABELS[lvl]}</div>
                <div className="h-1.5 bg-background rounded-full overflow-hidden mb-1">
                  <div className={`h-full rounded-full transition-all duration-700 ${LEVEL_BAR[lvl]}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="text-[10px] text-muted font-mono">{stats.solved}/{stats.total}</div>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleContinue}
          className="mt-4 flex items-center gap-2 bg-accent text-background px-5 py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          <Play size={15} /> Continue Learning
          <ChevronRight size={15} />
        </button>

        {/* Pattern Stats */}
        {topic.patternStats && Object.keys(topic.patternStats).length > 0 && (
          <div className="mt-6">
            <h4 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">Pattern Mastery</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(topic.patternStats).map(([name, count]) => (
                <div key={name} className="flex items-center gap-2 bg-background/50 border border-border px-3 py-1.5 rounded-lg">
                  <span className="text-xs text-primary font-medium">{name}</span>
                  <span className="text-[10px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded border border-accent/20">
                    {count} solved
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Questions list */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted">
            Level {activeLevel} Questions — {LEVEL_LABELS[activeLevel]}
          </h3>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${LEVEL_BG[activeLevel]} ${LEVEL_COLORS[activeLevel]}`}>
            {getLevelStats(activeLevel).solved}/{getLevelStats(activeLevel).total} solved
          </span>
        </div>

        {questions.length === 0 ? (
          <div className="h-32 flex flex-col items-center justify-center border border-dashed border-border rounded-xl text-muted text-sm">
            <BookOpen size={20} className="mb-2 opacity-40" />
            No questions yet for this level.
          </div>
        ) : (
          <div className="space-y-2">
            {questions.map((q, idx) => {
              const isSolved = solvedProblems.includes(q.id);
              const isLocked = activeLevel > 1 && getLevelStats((activeLevel - 1) as 1 | 2).solved === 0;

              return (
                <div key={q.id}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all group ${
                    isSolved ? 'border-accent/20 bg-accent/5' : isLocked ? 'border-border bg-background opacity-50' : 'border-border bg-background hover:border-accent/40 hover:bg-surface'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold font-mono border ${
                      isSolved ? 'bg-accent/20 border-accent/40 text-accent' : 'bg-background border-border text-muted'
                    }`}>
                      {isSolved ? <CheckCircle2 size={14} className="text-accent" /> : idx + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-semibold truncate ${isSolved ? 'text-accent' : 'text-primary'}`}>{q.title}</div>
                      <div className="text-xs text-muted truncate">{q.pattern}</div>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${LEVEL_BG[q.level]} ${LEVEL_COLORS[q.level]}`}>
                      {LEVEL_LABELS[q.level]}
                    </span>
                  </div>

                  <div className="ml-3 shrink-0">
                    {isLocked ? (
                      <Lock size={14} className="text-muted" />
                    ) : (
                      <button
                        onClick={() => handleSolve(q)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          isSolved
                            ? 'border border-accent/30 text-accent hover:bg-accent/10'
                            : 'bg-accent text-background hover:opacity-90'
                        }`}
                      >
                        <Code2 size={12} />
                        {isSolved ? 'Re-solve' : 'Solve'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
