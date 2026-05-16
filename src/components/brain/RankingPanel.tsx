import React, { useMemo } from 'react';
import { Trophy, Medal, Shield, Award } from 'lucide-react';
import { useBrainStore, getTierInfo, BRAIN_TIERS } from '../../store/useBrainStore';
import { computeTopicRankings, computeSmartBadges, getComparisonStatements } from '../../services/ranking.service';

const TierProgressBar: React.FC<{ rating: number }> = ({ rating }) => {
  const currentTier = getTierInfo(rating);
  const nextTier = BRAIN_TIERS.find(t => t.min > currentTier.max);
  const progress = nextTier
    ? Math.round(((rating - currentTier.min) / (currentTier.max - currentTier.min)) * 100)
    : 100;

  return (
    <div className="mt-2">
      <div className="flex justify-between text-[9px] text-muted mb-1">
        <span>{currentTier.tier}</span>
        <span>{nextTier?.tier ?? 'MAX'}</span>
      </div>
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-violet-500 to-purple-400 rounded-full transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>
      {nextTier && (
        <p className="text-[9px] text-muted mt-1 text-right">
          {nextTier.min - rating} pts to {nextTier.tier}
        </p>
      )}
    </div>
  );
};

export const RankingPanel: React.FC = () => {
  const { rating, sessions } = useBrainStore();
  const topicRankings = useMemo(() => computeTopicRankings().slice(0, 6), [sessions]);
  const badges = useMemo(() => computeSmartBadges(), [sessions]);
  const comparisons = useMemo(() => getComparisonStatements(), [rating]);
  const tierInfo = getTierInfo(rating.overall);
  const earnedBadges = badges.filter(b => b.earned);
  const lockedBadges = badges.filter(b => !b.earned).slice(0, 3);

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 space-y-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
          <Trophy size={16} className="text-violet-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-primary">Global Ranking</h3>
          <p className="text-[10px] text-muted">Your intelligent skill-based ranking</p>
        </div>
      </div>

      {/* Main Rating Card */}
      <div className="bg-gradient-to-br from-violet-500/15 to-purple-500/5 border border-violet-500/20 rounded-2xl p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Brain Rating</div>
            <div className="text-4xl font-black font-mono text-primary">
              {rating.overall > 0 ? rating.overall : '—'}
            </div>
          </div>
          <div className="text-right">
            <div className={`text-sm font-bold px-3 py-1 rounded-full border ${tierInfo.bg ?? 'bg-violet-500/10'} ${tierInfo.color}`}>
              {tierInfo.tier}
            </div>
            {rating.percentileRank > 0 && (
              <div className="text-[10px] text-muted mt-2">
                Top <span className="font-bold text-violet-400">{100 - rating.percentileRank}%</span> globally
              </div>
            )}
          </div>
        </div>
        <TierProgressBar rating={rating.overall} />
      </div>

      {/* Skill Scores */}
      {rating.overall > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Code Quality', value: rating.codeQuality, icon: Shield, color: 'text-blue-400' },
            { label: 'Optimization', value: rating.optimization, icon: Medal, color: 'text-violet-400' },
            { label: 'Debugging',    value: rating.debugging,   icon: Award,  color: 'text-green-400' },
            { label: 'Consistency',  value: rating.consistency, icon: Trophy, color: 'text-amber-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-background/50 rounded-xl p-3 border border-border/50">
              <div className={`flex items-center gap-1.5 text-[10px] font-bold ${color} mb-1`}>
                <Icon size={10} /> {label}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
                  <div className={`h-full rounded-full bg-current ${color}`} style={{ width: `${value}%` }} />
                </div>
                <span className="text-[10px] font-mono text-primary">{value}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comparison statements */}
      {comparisons.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] font-bold text-muted uppercase tracking-widest">Global Standing</div>
          {comparisons.map((stmt, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-muted">
              <span className="text-violet-400 mt-0.5">▸</span>
              {stmt}
            </div>
          ))}
        </div>
      )}

      {/* Topic Rankings */}
      {topicRankings.length > 0 && (
        <div>
          <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">Topic Rankings</div>
          <div className="space-y-2">
            {topicRankings.map(rank => (
              <div key={rank.topicId} className="flex items-center gap-3">
                <span className="text-[10px] text-muted w-24 shrink-0 truncate">{rank.topicName}</span>
                <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-purple-400 rounded-full transition-all"
                    style={{ width: `${rank.percentile}%` }}
                  />
                </div>
                <span className={`text-[10px] font-bold shrink-0 w-14 text-right ${
                  rank.percentile >= 70 ? 'text-green-400' : rank.percentile >= 40 ? 'text-blue-400' : 'text-muted'
                }`}>{rank.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Badges */}
      <div>
        <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">
          Badges
          {earnedBadges.length > 0 && (
            <span className="ml-2 text-violet-400">{earnedBadges.length} earned</span>
          )}
        </div>
        {earnedBadges.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-3">
            {earnedBadges.map(b => (
              <div key={b.id} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold ${b.color}`} title={b.description}>
                <span>{b.icon}</span>
                <span>{b.label}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[10px] text-muted/60 mb-3 italic">Complete Brain sessions to earn badges.</p>
        )}
        {/* Locked badges */}
        {lockedBadges.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {lockedBadges.map(b => (
              <div key={b.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-border/40 bg-background/30 text-xs font-bold text-muted/40 grayscale" title={b.description}>
                <span>{b.icon}</span>
                <span>{b.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
