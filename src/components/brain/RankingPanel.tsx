import React, { useMemo } from 'react';
import { Trophy, Medal, Shield, Award, History as HistoryIcon } from 'lucide-react';
import { useBrainStore, getTierInfo, BRAIN_TIERS } from '../../store/useBrainStore';
import { computeTopicRankings, computeSmartBadges, getComparisonStatements } from '../../services/ranking.service';

// ─── Tier Progress Bar ───────────────────────────────────────────────────────

const TierProgressBar: React.FC<{ rating: number }> = ({ rating }) => {
  const currentTier = getTierInfo(rating);
  const nextTier = BRAIN_TIERS.find(t => t.min > currentTier.max);
  const progress = nextTier
    ? Math.round(((rating - currentTier.min) / (currentTier.max - currentTier.min)) * 100)
    : 100;

  return (
    <div className="mt-2">
      <div className="flex justify-between text-[9px] text-muted mb-1">
        <span className={currentTier.color}>{currentTier.icon} {currentTier.tier}</span>
        <span>{nextTier ? `${nextTier.icon} ${nextTier.tier}` : '🏆 MAX'}</span>
      </div>
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-violet-500 to-purple-400 rounded-full transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>
      {nextTier ? (
        <p className="text-[9px] text-muted mt-1 text-right">
          {nextTier.min - rating} pts to <span className={nextTier.color}>{nextTier.tier}</span>
        </p>
      ) : (
        <p className="text-[9px] text-yellow-300 mt-1 text-right font-bold">Maximum tier reached 🏆</p>
      )}
    </div>
  );
};

// ─── Session History ─────────────────────────────────────────────────────────

const SessionHistoryInner: React.FC = () => {
  const { sessions } = useBrainStore();
  
  const verdictConfig = {
    correct:    { color: 'text-green-400',  dot: 'bg-green-400' },
    suboptimal: { color: 'text-yellow-400', dot: 'bg-yellow-400' },
    wrong:      { color: 'text-rose-400',   dot: 'bg-rose-400' },
    skipped:    { color: 'text-muted',      dot: 'bg-muted' },
  };

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-4">
        <HistoryIcon size={14} className="text-violet-400" />
        <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest">Recent Activity</h3>
      </div>
      {sessions.length === 0 ? (
        <div className="h-full flex items-center justify-center border border-dashed border-border/40 rounded-2xl p-8 text-center">
          <p className="text-[10px] text-muted italic">No sessions recorded yet.<br/>Generate a question to start!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.slice(0, 8).map(s => {
            const vc = verdictConfig[s.verdict] || verdictConfig.skipped;
            return (
              <div key={s.id} className="group flex items-center gap-3 p-3 rounded-xl bg-background/40 border border-border/50 hover:border-violet-500/30 transition-all cursor-default">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${vc.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold text-primary truncate group-hover:text-violet-300 transition-colors">{s.questionTitle}</div>
                  <div className="flex items-center gap-2 text-[9px] text-muted/60 mt-0.5">
                    <span className="truncate">{s.topic}</span>
                    <span>·</span>
                    <span>{Math.round(s.timeTaken / 60)}m</span>
                  </div>
                </div>
                <div className={`text-[10px] font-bold ${vc.color} shrink-0 opacity-80`}>
                  {s.verdict === 'correct' ? 'PASSED' : s.verdict.toUpperCase()}
                </div>
              </div>
            );
          })}
          {sessions.length > 8 && (
            <p className="text-[9px] text-muted text-center pt-2">+{sessions.length - 8} more in history</p>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Tier Ladder ─────────────────────────────────────────────────────────────

const TierLadder: React.FC<{ currentRating: number }> = ({ currentRating }) => {
  const currentTierIndex = BRAIN_TIERS.findIndex(t => currentRating >= t.min && currentRating <= t.max);

  return (
    <div className="w-48 shrink-0">
      <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3 text-right">Progression</div>
      <div className="space-y-1">
        {[...BRAIN_TIERS].reverse().map((tier, reversedIdx) => {
          const idx = BRAIN_TIERS.length - 1 - reversedIdx;
          const isCurrent = idx === currentTierIndex;
          const isUnlocked = currentRating >= tier.min;
          const isNext = idx === currentTierIndex + 1;

          return (
            <div
              key={tier.tier}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-all ${
                isCurrent
                  ? `${tier.bg} border border-current/30 scale-[1.02]`
                  : isUnlocked
                  ? 'bg-background/20 border border-border/20 opacity-50'
                  : isNext
                  ? 'bg-background/10 border border-dashed border-border/30 opacity-40'
                  : 'bg-transparent border border-transparent opacity-20'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs leading-none shrink-0">{tier.icon}</span>
                <span className={`text-[10px] font-bold truncate ${isCurrent ? tier.color : isUnlocked ? 'text-primary' : 'text-muted'}`}>
                  {tier.tier}
                </span>
              </div>
              <div className="shrink-0 text-[8px] font-mono opacity-50 ml-2">
                {tier.min}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Main Panel ───────────────────────────────────────────────────────────────

export const RankingPanel: React.FC = () => {
  const { rating, sessions } = useBrainStore();
  const topicRankings = useMemo(() => computeTopicRankings().slice(0, 6), [sessions]);
  const badges = useMemo(() => computeSmartBadges(), [sessions]);
  const comparisons = useMemo(() => getComparisonStatements(), [rating]);
  const tierInfo = getTierInfo(rating.overall);
  const earnedBadges = badges.filter(b => b.earned);
  const lockedBadges = badges.filter(b => !b.earned).slice(0, 3);

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 space-y-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
            <Trophy size={16} className="text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-primary">Global Ranking</h3>
            <p className="text-[10px] text-muted">Skill-based progression & history</p>
          </div>
        </div>
      </div>

      {/* Main Rating Card */}
      <div className={`bg-gradient-to-br ${tierInfo.bg.replace('bg-', 'from-').replace('/20', '/20')} to-violet-500/5 border border-current/10 rounded-2xl p-5 ${tierInfo.color}`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-[10px] font-bold opacity-70 uppercase tracking-widest mb-1 text-white">Brain Rating</div>
            <div className="text-4xl font-black font-mono text-white">
              {rating.overall > 0 ? rating.overall : '—'}
            </div>
          </div>
          <div className="text-right">
            <div className={`flex items-center gap-1.5 text-lg font-black px-3 py-1.5 rounded-xl border bg-black/20 ${tierInfo.color} border-current/30 shadow-lg shadow-black/20`}>
              <span>{tierInfo.icon}</span>
              <span className="text-sm">{tierInfo.tier}</span>
            </div>
            {rating.percentileRank > 0 && (
              <div className="text-[10px] text-white/60 mt-2">
                Top <span className="font-bold text-white">{100 - rating.percentileRank}%</span> globally
              </div>
            )}
          </div>
        </div>
        <TierProgressBar rating={rating.overall} />
      </div>

      {/* Side-by-Side: History & Ladder */}
      <div className="flex gap-8 items-start">
        <SessionHistoryInner />
        <div className="w-px self-stretch bg-border/40" />
        <TierLadder currentRating={rating.overall} />
      </div>

      {/* Stats Row */}
      {rating.overall > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Code', value: rating.codeQuality, icon: Shield, color: 'text-blue-400' },
            { label: 'Opti', value: rating.optimization, icon: Medal, color: 'text-violet-400' },
            { label: 'Debug', value: rating.debugging, icon: Award, color: 'text-green-400' },
            { label: 'Const', value: rating.consistency, icon: Trophy, color: 'text-amber-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-background/40 rounded-xl p-2.5 border border-border/50 text-center">
              <div className={`flex items-center justify-center gap-1.5 text-[9px] font-bold ${color} mb-1.5 uppercase`}>
                <Icon size={9} /> {label}
              </div>
              <div className="text-xs font-mono font-bold text-primary">{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Standing & Badges (Combined bottom section) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border/40">
        <div className="space-y-4">
            {comparisons.length > 0 && (
                <div className="space-y-2">
                    <div className="text-[10px] font-bold text-muted uppercase tracking-widest">Standing</div>
                    {comparisons.slice(0, 3).map((stmt, i) => (
                        <div key={i} className="flex items-start gap-2 text-[11px] text-muted leading-tight">
                            <span className="text-violet-400 mt-0.5 shrink-0">▸</span>
                            {stmt}
                        </div>
                    ))}
                </div>
            )}

            {topicRankings.length > 0 && (
                <div>
                    <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">Topic Strengths</div>
                    <div className="space-y-2">
                        {topicRankings.slice(0, 3).map(rank => (
                            <div key={rank.topicId} className="flex items-center gap-2">
                                <span className="text-[10px] text-muted w-16 shrink-0 truncate">{rank.topicName}</span>
                                <div className="flex-1 h-1 bg-border/40 rounded-full overflow-hidden">
                                    <div className="h-full bg-violet-500/60" style={{ width: `${rank.percentile}%` }} />
                                </div>
                                <span className="text-[9px] font-bold text-violet-400">{rank.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>

        <div className="space-y-4">
            <div className="text-[10px] font-bold text-muted uppercase tracking-widest">Badges</div>
            <div className="flex flex-wrap gap-2">
                {earnedBadges.map(b => (
                    <div key={b.id} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-bold ${b.color}`} title={b.description}>
                        <span>{b.icon}</span>
                        <span>{b.label}</span>
                    </div>
                ))}
                {lockedBadges.map(b => (
                    <div key={b.id} className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-border/40 bg-background/20 text-[10px] font-bold text-muted/40 grayscale" title={b.description}>
                        <span>{b.icon}</span>
                        <span>{b.label}</span>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};
