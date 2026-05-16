import React, { useEffect, useRef } from 'react';
import { Brain, Zap, History, Trash2, ChevronRight } from 'lucide-react';
import { useBrainStore, getTierInfo } from '../store/useBrainStore';
import { generateLocalRevisionSchedule } from '../services/brain.service';
import { SkillRadarPanel } from '../components/brain/SkillRadarPanel';
import { AdaptiveQuestGenPanel } from '../components/brain/AdaptiveQuestGenPanel';
import { SolutionJudgePanel } from '../components/brain/SolutionJudgePanel';
import { BehaviorInsightsPanel } from '../components/brain/BehaviorInsightsPanel';
import { RankingPanel } from '../components/brain/RankingPanel';

// ─────────────────────────────────────────────────────────────────────────────
// Brain Header
// ─────────────────────────────────────────────────────────────────────────────

const NeuralPulse: React.FC = () => (
  <div className="relative w-14 h-14 flex items-center justify-center">
    {/* Concentric rings */}
    <div className="absolute inset-0 rounded-full border border-violet-500/20 animate-ping" style={{ animationDuration: '2s' }} />
    <div className="absolute inset-2 rounded-full border border-violet-500/30 animate-ping" style={{ animationDuration: '2.4s', animationDelay: '0.2s' }} />
    <div className="absolute inset-4 rounded-full bg-gradient-to-br from-violet-500/40 to-purple-600/30 blur-sm" />
    <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/30">
      <Brain size={20} className="text-white" />
    </div>
  </div>
);

const BrainHeader: React.FC = () => {
  const { rating, sessions, personalitySummary, clearSessions } = useBrainStore();
  const tierInfo = getTierInfo(rating.overall);

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-violet-950/80 via-purple-950/60 to-background border border-violet-500/20 rounded-2xl p-6 mb-6">
      {/* Scanline effect */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, rgba(139,92,246,1) 0px, rgba(139,92,246,1) 1px, transparent 1px, transparent 4px)',
        }}
      />
      {/* Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />

      <div className="relative flex flex-col md:flex-row items-start md:items-center gap-5">
        <NeuralPulse />

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-violet-300 via-purple-200 to-white bg-clip-text text-transparent">
                PatternLab Brain
              </span>
            </h1>
            <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${tierInfo.color} ${tierInfo.bg ?? 'bg-violet-500/10'} border-current/30`}>
              <span>{tierInfo.icon}</span>
              <span>{tierInfo.tier}</span>
            </div>
          </div>
          <p className="text-sm text-violet-200/60 max-w-lg">
            {personalitySummary || 'Adaptive AI mentor · Evaluator · Learning engine. Powered by behavioral intelligence.'}
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-4 shrink-0">
          <div className="text-center">
            <div className="text-2xl font-black font-mono text-white">
              {rating.overall > 0 ? rating.overall : '—'}
            </div>
            <div className="text-[9px] text-violet-400/70 uppercase tracking-widest">Rating</div>
          </div>
          <div className="w-px bg-violet-500/20" />
          <div className="text-center">
            <div className="text-2xl font-black font-mono text-white">
              {rating.percentileRank > 0 ? `${100 - rating.percentileRank}%` : '—'}
            </div>
            <div className="text-[9px] text-violet-400/70 uppercase tracking-widest">Top</div>
          </div>
          <div className="w-px bg-violet-500/20" />
          <div className="text-center">
            <div className="text-2xl font-black font-mono text-white">{sessions.length}</div>
            <div className="text-[9px] text-violet-400/70 uppercase tracking-widest">Sessions</div>
          </div>
        </div>
      </div>

      {/* Quick stat pills */}
      {sessions.length > 0 && (
        <div className="relative flex flex-wrap gap-2 mt-5 pt-4 border-t border-violet-500/10">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full text-[10px] text-violet-300">
            <Zap size={9} /> Code Quality: {rating.codeQuality}/100
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full text-[10px] text-violet-300">
            <Zap size={9} /> Optimization: {rating.optimization}/100
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full text-[10px] text-violet-300">
            <Zap size={9} /> Debugging: {rating.debugging}/100
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full text-[10px] text-violet-300">
            <Zap size={9} /> Consistency: {rating.consistency}/100
          </div>
          <button
            onClick={() => { if (confirm('Reset all Brain sessions and ratings?')) clearSessions(); }}
            className="ml-auto flex items-center gap-1 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full text-[10px] text-rose-400 hover:bg-rose-500/20 transition-colors"
          >
            <Trash2 size={9} /> Reset
          </button>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Session History (compact)
// ─────────────────────────────────────────────────────────────────────────────

const SessionHistory: React.FC = () => {
  const { sessions } = useBrainStore();
  if (sessions.length === 0) return null;

  const verdictConfig = {
    correct:    { color: 'text-green-400',  dot: 'bg-green-400' },
    suboptimal: { color: 'text-yellow-400', dot: 'bg-yellow-400' },
    wrong:      { color: 'text-rose-400',   dot: 'bg-rose-400' },
    skipped:    { color: 'text-muted',      dot: 'bg-muted' },
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <History size={14} className="text-violet-400" />
        <h3 className="text-sm font-bold text-primary">Recent Sessions</h3>
        <span className="ml-auto text-[10px] text-muted">{sessions.length} total</span>
      </div>
      <div className="space-y-2">
        {sessions.slice(0, 5).map(s => {
          const vc = verdictConfig[s.verdict];
          return (
            <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-background/40 border border-border/50 hover:border-border transition-colors">
              <div className={`w-2 h-2 rounded-full shrink-0 ${vc.dot}`} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-primary truncate">{s.questionTitle}</div>
                <div className="flex gap-3 text-[9px] text-muted mt-0.5">
                  <span>{s.topic}</span>
                  <span>·</span>
                  <span>{s.difficulty}</span>
                  <span>·</span>
                  <span>{Math.round(s.timeTaken / 60)}m</span>
                  <span>·</span>
                  <span>{s.hintsUsed} hints</span>
                </div>
              </div>
              <div className={`text-[10px] font-bold ${vc.color} shrink-0`}>
                {s.verdict}
              </div>
              <ChevronRight size={12} className="text-muted/40 shrink-0" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main BrainPage
// ─────────────────────────────────────────────────────────────────────────────

export const BrainPage: React.FC = () => {
  const { setRevisionSchedule, revisionSchedule } = useBrainStore();
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      // Populate local revision schedule on first load
      const local = generateLocalRevisionSchedule();
      if (local.length > 0) setRevisionSchedule(local);
    }
  }, []);

  return (
    <div className="h-full overflow-y-auto bg-background text-primary p-4 md:p-8">
      <div className="max-w-7xl mx-auto">

        <BrainHeader />

        {/* Main 2-column grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          {/* Left column */}
          <div className="flex flex-col gap-6">
            <SkillRadarPanel />
            <BehaviorInsightsPanel />
            <SessionHistory />
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-6">
            <RankingPanel />
            <AdaptiveQuestGenPanel />
          </div>
        </div>

        {/* Full-width Solution Judge */}
        <SolutionJudgePanel />

        {/* Footer */}
        <div className="mt-8 text-center text-[10px] text-muted/40">
          PatternLab Brain · Powered by Gemini AI · All analysis is local & private
        </div>
      </div>
    </div>
  );
};
