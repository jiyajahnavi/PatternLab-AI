import React, { useEffect, useState } from 'react';
import { Activity, Clock, AlertCircle, TrendingUp, RefreshCw, Loader2, CalendarClock } from 'lucide-react';
import { useBrainStore, type BehavioralTrait, type RevisionItem } from '../../store/useBrainStore';
import { analyzeSkillProfile, generateLocalRevisionSchedule } from '../../services/brain.service';

const TraitCard: React.FC<{ trait: BehavioralTrait }> = ({ trait }) => {
  const config = {
    strength: { border: 'border-green-500/30 bg-green-500/5', dot: 'bg-green-400', text: 'text-green-400' },
    weakness:  { border: 'border-rose-500/30 bg-rose-500/5',  dot: 'bg-rose-400',  text: 'text-rose-400' },
    neutral:   { border: 'border-border bg-background/40',    dot: 'bg-blue-400',  text: 'text-blue-400' },
  }[trait.type];

  return (
    <div className={`p-3 rounded-xl border ${config.border} flex items-start gap-3`}>
      <div className={`w-2 h-2 rounded-full ${config.dot} mt-1 shrink-0`} />
      <div>
        <div className={`text-xs font-bold ${config.text}`}>{trait.trait}</div>
        <p className="text-[10px] text-muted mt-0.5 leading-relaxed">{trait.description}</p>
      </div>
    </div>
  );
};

const urgencyConfig = {
  critical: { color: 'text-rose-400',   bg: 'bg-rose-500/10 border-rose-500/30',    label: 'Critical' },
  high:     { color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30', label: 'High' },
  medium:   { color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', label: 'Medium' },
  low:      { color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/30',     label: 'Low' },
};

const RevisionCard: React.FC<{ item: RevisionItem }> = ({ item }) => {
  const cfg = urgencyConfig[item.urgency];
  return (
    <div className={`flex items-center justify-between p-3 rounded-xl border ${cfg.bg}`}>
      <div className="flex items-center gap-3">
        <CalendarClock size={14} className={cfg.color} />
        <div>
          <div className="text-xs font-bold text-primary">{item.topicName}</div>
          <p className="text-[10px] text-muted">{item.reason}</p>
        </div>
      </div>
      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${cfg.color} border ${cfg.bg}`}>
        <Clock size={8} />
        {item.daysSinceAttempt}d ago
      </div>
    </div>
  );
};

export const BehaviorInsightsPanel: React.FC = () => {
  const { behavioralTraits, revisionSchedule, sessions, personalitySummary,
          setBehavioralTraits, setRevisionSchedule } = useBrainStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Generate local revision schedule on mount
  useEffect(() => {
    const local = generateLocalRevisionSchedule();
    if (local.length > 0 && revisionSchedule.length === 0) {
      setRevisionSchedule(local);
    }
  }, []);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      await analyzeSkillProfile();
    } finally {
      setIsAnalyzing(false);
    }
  };

  const hasData = sessions.length >= 2;
  const strengths = behavioralTraits.filter(t => t.type === 'strength');
  const weaknesses = behavioralTraits.filter(t => t.type === 'weakness');
  const neutral = behavioralTraits.filter(t => t.type === 'neutral');

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 space-y-5 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-48 h-48 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
            <Activity size={16} className="text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-primary">Behavioral Insights</h3>
            <p className="text-[10px] text-muted">AI analysis of your solving patterns</p>
          </div>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !hasData}
          title={!hasData ? 'Complete 2+ sessions to unlock' : 'Refresh AI analysis'}
          className="p-2 rounded-lg border border-border text-muted hover:text-violet-400 hover:border-violet-500/40 transition-all disabled:opacity-40"
        >
          {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
        </button>
      </div>

      {/* Personality summary */}
      {personalitySummary && (
        <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/5 border border-violet-500/20 rounded-xl p-4">
          <div className="text-[9px] font-bold text-violet-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
            <TrendingUp size={9} /> Brain Profile
          </div>
          <p className="text-xs text-primary leading-relaxed italic">"{personalitySummary}"</p>
        </div>
      )}

      {/* Empty state */}
      {!hasData && (
        <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-border rounded-xl bg-background/30">
          <AlertCircle size={24} className="text-muted mb-3" />
          <p className="text-sm font-semibold text-muted">Not enough data yet</p>
          <p className="text-[10px] text-muted/60 mt-1 max-w-48">
            Complete 2+ Brain sessions (generate a question + submit code) to unlock behavioral analysis.
          </p>
        </div>
      )}

      {/* Traits */}
      {behavioralTraits.length > 0 && (
        <div className="space-y-3">
          {strengths.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-green-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                <TrendingUp size={9} /> Strengths
              </div>
              <div className="space-y-2">
                {strengths.map(t => <TraitCard key={t.id} trait={t} />)}
              </div>
            </div>
          )}
          {weaknesses.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                <AlertCircle size={9} /> Areas to Improve
              </div>
              <div className="space-y-2">
                {weaknesses.map(t => <TraitCard key={t.id} trait={t} />)}
              </div>
            </div>
          )}
          {neutral.length > 0 && (
            <div className="space-y-2">
              {neutral.map(t => <TraitCard key={t.id} trait={t} />)}
            </div>
          )}
        </div>
      )}

      {/* Revision Schedule */}
      {revisionSchedule.length > 0 && (
        <div>
          <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <CalendarClock size={10} /> Revision Due
          </div>
          <div className="space-y-2">
            {revisionSchedule.map(item => (
              <RevisionCard key={item.topicId} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
