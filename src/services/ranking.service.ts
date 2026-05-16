import { useBrainStore } from '../store/useBrainStore';
import { useProgressStore } from '../store/useProgressStore';

// ─────────────────────────────────────────────────────────────────────────────
// Per-topic ranking (simulated)
// ─────────────────────────────────────────────────────────────────────────────

export interface TopicRank {
  topicId: string;
  topicName: string;
  score: number;         // 0–100
  percentile: number;   // 0–100
  label: string;        // "Top 12%"
  badge?: string;
}

// Simulate a user pool for percentile calculation.
// Returns a realistic percentile from a score using a Gaussian distribution.
// Population mean=55, σ=18. This gives meaningful spread without real data.
function scoreToPercentile(score: number): number {
  const mean = 55, sigma = 18;
  const z = (score - mean) / sigma;
  const erf = (x: number) => {
    const a1=0.254829592,a2=-0.284496736,a3=1.421413741,a4=-1.453152027,a5=1.061405429,p=0.3275911;
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5*t+a4)*t)+a3)*t+a2)*t+a1)*t*Math.exp(-x*x);
    return sign * y;
  };
  const pct = 0.5 * (1 + erf(z / Math.sqrt(2)));
  return Math.round(Math.min(99, Math.max(1, pct * 100)));
}

function getTopicScore(topicId: string): number {
  const progress = useProgressStore.getState();
  const brain = useBrainStore.getState();
  const topic = progress.topics[topicId];
  if (!topic) return 0;

  const totalPossible = topic.level1.total + topic.level2.total + topic.level3.total;
  const totalSolved = topic.level1.solved + topic.level2.solved + topic.level3.solved;
  if (totalPossible === 0) return 0;

  const solveRatio = totalSolved / totalPossible;

  // Weight towards harder levels
  const weightedSolve =
    (topic.level1.total > 0 ? (topic.level1.solved / topic.level1.total) * 0.2 : 0) +
    (topic.level2.total > 0 ? (topic.level2.solved / topic.level2.total) * 0.35 : 0) +
    (topic.level3.total > 0 ? (topic.level3.solved / topic.level3.total) * 0.45 : 0);

  // Brain session bonus
  const topicSessions = brain.sessions.filter(s => s.topic.toLowerCase() === topicId);
  const brainBonus = topicSessions.length > 0
    ? Math.min(20, topicSessions.reduce((a, s) => a + s.optimizationScore, 0) / topicSessions.length / 5)
    : 0;

  return Math.round(Math.min(100, weightedSolve * 80 + brainBonus + (solveRatio * 20)));
}

function getTopicBadge(percentile: number, topicName: string): string | undefined {
  if (percentile >= 95) return `${topicName} Legend`;
  if (percentile >= 85) return `${topicName} Expert`;
  if (percentile >= 70) return `${topicName} Ace`;
  return undefined;
}

export function computeTopicRankings(): TopicRank[] {
  const progress = useProgressStore.getState();
  return Object.values(progress.topics)
    .map(topic => {
      const score = getTopicScore(topic.id);
      const percentile = scoreToPercentile(score);
      const label = percentile >= 50 ? `Top ${100 - percentile}%` : `Bottom ${percentile}%`;
      return {
        topicId: topic.id,
        topicName: topic.name,
        score,
        percentile,
        label,
        badge: getTopicBadge(percentile, topic.name),
      } as TopicRank;
    })
    .filter(r => r.score > 0)
    .sort((a, b) => b.percentile - a.percentile);
}

// ─────────────────────────────────────────────────────────────────────────────
// Smart Badges
// ─────────────────────────────────────────────────────────────────────────────

export interface SmartBadge {
  id: string;
  label: string;
  description: string;
  icon: string;
  earned: boolean;
  color: string;
}

export function computeSmartBadges(): SmartBadge[] {
  const brain = useBrainStore.getState();
  const progress = useProgressStore.getState();
  const { sessions, rating } = brain;

  const badges: SmartBadge[] = [
    {
      id: 'optimizer',
      label: 'Optimization Expert',
      description: '3+ correct optimal solutions in a row',
      icon: '⚡',
      earned: sessions.slice(0, 5).filter(s => s.verdict === 'correct' && s.optimizationScore >= 80).length >= 3,
      color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    },
    {
      id: 'debugger',
      label: 'Debugging Ace',
      description: 'Solved 5 problems on first submission',
      icon: '🐛',
      earned: sessions.filter(s => s.submissionCount === 1 && s.verdict === 'correct').length >= 5,
      color: 'text-green-400 bg-green-500/10 border-green-500/30',
    },
    {
      id: 'hintless',
      label: 'No Lifelines',
      description: '5 problems solved with zero hints',
      icon: '🎯',
      earned: sessions.filter(s => s.hintsUsed === 0 && s.verdict === 'correct').length >= 5,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    },
    {
      id: 'consistent',
      label: 'Streak Master',
      description: '10+ day streak recorded',
      icon: '🔥',
      earned: progress.maxStreak >= 10,
      color: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    },
    {
      id: 'advanced-solver',
      label: 'Hard Problem Slayer',
      description: 'Solved 3 advanced Brain problems correctly',
      icon: '🏆',
      earned: sessions.filter(s => s.difficulty === 'advanced' && s.verdict === 'correct').length >= 3,
      color: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
    },
    {
      id: 'speed-demon',
      label: 'Speed Demon',
      description: 'Solved an intermediate problem in under 10 minutes',
      icon: '💨',
      earned: sessions.some(s => s.difficulty === 'intermediate' && s.timeTaken < 600 && s.verdict === 'correct'),
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    },
    {
      id: 'elite',
      label: 'Elite Tier',
      description: 'Brain Rating above 1400',
      icon: '👑',
      earned: rating.overall >= 1400,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    },
  ];

  return badges;
}

// ─────────────────────────────────────────────────────────────────────────────
// Global comparison statements
// ─────────────────────────────────────────────────────────────────────────────

export function getComparisonStatements(): string[] {
  const { rating } = useBrainStore.getState();
  const stmts: string[] = [];
  if (rating.percentileRank > 50) stmts.push(`Better optimization skills than ${rating.percentileRank}% of users`);
  if (rating.codeQuality >= 75) stmts.push(`Code quality in top ${100 - Math.round(rating.codeQuality * 0.8)}% of PatternLab`);
  if (rating.debugging >= 80) stmts.push(`Excellent first-attempt debugging speed`);
  if (rating.consistency >= 70) stmts.push(`Strong interview-style reasoning consistency`);
  if (rating.overall === 0) stmts.push(`Complete Brain sessions to unlock your global ranking`);
  return stmts;
}
