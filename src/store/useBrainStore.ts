import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type BrainDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface SkillScore {
  topicId: string;
  topicName: string;
  masteryScore: number;
  optimizationScore: number;
  speedScore: number;
  consistencyScore: number;
  hintDependency: number;
  lastUpdated: string;
}

export interface BrainSession {
  id: string;
  questionId: string;
  questionTitle: string;
  topic: string;
  pattern: string;
  difficulty: BrainDifficulty;
  timeTaken: number;
  hintsUsed: number;
  submissionCount: number;
  verdict: 'correct' | 'suboptimal' | 'wrong' | 'skipped';
  aiReviewSummary: string;
  codeQualityScore: number;
  optimizationScore: number;
  edgeCaseScore: number;
  timestamp: string;
}

export interface BrainRating {
  overall: number;
  codeQuality: number;
  optimization: number;
  debugging: number;
  consistency: number;
  percentileRank: number;
  tier: 'Novice' | 'Apprentice' | 'Practitioner' | 'Expert' | 'Master' | 'Grandmaster';
}

export interface BehavioralTrait {
  id: string;
  trait: string;
  description: string;
  type: 'strength' | 'weakness' | 'neutral';
}

export interface RevisionItem {
  topicId: string;
  topicName: string;
  daysSinceAttempt: number;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  reason: string;
}

export interface BrainReviewResult {
  verdict: 'correct' | 'suboptimal' | 'wrong';
  overallScore: number;
  codeQualityScore: number;
  optimizationScore: number;
  edgeCaseScore: number;
  timeComplexity: string;
  spaceComplexity: string;
  targetComplexity: string;
  mentorFeedback: string;
  improvementHints: string[];
  lineAnnotations: { line: number; severity: 'error' | 'warning' | 'success' | 'info'; message: string }[];
  betterApproach?: string;
}

export const BRAIN_TIERS: { min: number; max: number; tier: BrainRating['tier']; color: string; bg: string }[] = [
  { min: 0,    max: 399,  tier: 'Novice',       color: 'text-slate-400',  bg: 'bg-slate-500/20' },
  { min: 400,  max: 799,  tier: 'Apprentice',   color: 'text-green-400',  bg: 'bg-green-500/20' },
  { min: 800,  max: 1099, tier: 'Practitioner', color: 'text-blue-400',   bg: 'bg-blue-500/20' },
  { min: 1100, max: 1399, tier: 'Expert',       color: 'text-violet-400', bg: 'bg-violet-500/20' },
  { min: 1400, max: 1699, tier: 'Master',       color: 'text-amber-400',  bg: 'bg-amber-500/20' },
  { min: 1700, max: 2000, tier: 'Grandmaster',  color: 'text-rose-400',   bg: 'bg-rose-500/20' },
];

export function getTierInfo(rating: number) {
  return BRAIN_TIERS.find(t => rating >= t.min && rating <= t.max) ?? BRAIN_TIERS[0];
}

function erf(x: number): number {
  const a1=0.254829592,a2=-0.284496736,a3=1.421413741,a4=-1.453152027,a5=1.061405429,p=0.3275911;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5*t+a4)*t)+a3)*t+a2)*t+a1)*t*Math.exp(-x*x);
  return sign * y;
}

function computeRating(sessions: BrainSession[]): BrainRating {
  if (sessions.length === 0) {
    return { overall: 0, codeQuality: 0, optimization: 0, debugging: 0, consistency: 0, percentileRank: 0, tier: 'Novice' };
  }
  const recent = sessions.slice(0, 20);
  const codeQuality = Math.round(recent.reduce((a, s) => a + s.codeQualityScore, 0) / recent.length);
  const optimization = Math.round(recent.reduce((a, s) => a + s.optimizationScore, 0) / recent.length);
  const edgeCases = Math.round(recent.reduce((a, s) => a + s.edgeCaseScore, 0) / recent.length);
  const correctRate = recent.filter(s => s.verdict === 'correct').length / recent.length;
  const consistency = Math.round(correctRate * 100);
  const avgHints = recent.reduce((a, s) => a + s.hintsUsed, 0) / recent.length;
  const hintPenalty = Math.min(avgHints * 5, 25);
  const diffBonus = recent.reduce((a, s) => a + (s.difficulty === 'advanced' ? 15 : s.difficulty === 'intermediate' ? 8 : 2), 0) / recent.length;
  const rawScore = (codeQuality*0.25)+(optimization*0.25)+(edgeCases*0.15)+(consistency*0.20)+diffBonus-hintPenalty;
  const overall = Math.round(Math.min(2000, Math.max(0, rawScore * 20)));
  const z = (overall - 900) / 300;
  const pct = 0.5 * (1 + erf(z / Math.sqrt(2)));
  const percentileRank = Math.round(Math.min(99, Math.max(1, pct * 100)));
  const avgSubs = recent.reduce((a, s) => a + s.submissionCount, 0) / recent.length;
  const debugging = Math.round(Math.max(0, 100 - (avgSubs - 1) * 20));
  const tier = getTierInfo(overall).tier;
  return { overall, codeQuality, optimization, debugging, consistency, percentileRank, tier };
}

interface BrainState {
  skillScores: Record<string, SkillScore>;
  sessions: BrainSession[];
  rating: BrainRating;
  behavioralTraits: BehavioralTrait[];
  revisionSchedule: RevisionItem[];
  personalitySummary: string;
  isGenerating: boolean;
  isEvaluating: boolean;
  currentQuestion: any | null;
  currentReview: BrainReviewResult | null;
  addSession: (session: BrainSession) => void;
  updateSkillScore: (topicId: string, updates: Partial<SkillScore>) => void;
  recomputeRating: () => void;
  setBehavioralTraits: (traits: BehavioralTrait[]) => void;
  setRevisionSchedule: (items: RevisionItem[]) => void;
  setGenerating: (v: boolean) => void;
  setEvaluating: (v: boolean) => void;
  setCurrentQuestion: (q: any | null) => void;
  setCurrentReview: (r: BrainReviewResult | null) => void;
  setPersonalitySummary: (s: string) => void;
  clearSessions: () => void;
}

const DEFAULT_RATING: BrainRating = { overall: 0, codeQuality: 0, optimization: 0, debugging: 0, consistency: 0, percentileRank: 0, tier: 'Novice' };

export const useBrainStore = create<BrainState>()(
  persist(
    (set, get) => ({
      skillScores: {},
      sessions: [],
      rating: DEFAULT_RATING,
      behavioralTraits: [],
      revisionSchedule: [],
      personalitySummary: '',
      isGenerating: false,
      isEvaluating: false,
      currentQuestion: null,
      currentReview: null,

      addSession: (session) => set(state => {
        const updated = [session, ...state.sessions].slice(0, 50);
        return { sessions: updated, rating: computeRating(updated) };
      }),

      updateSkillScore: (topicId, updates) => set(state => ({
        skillScores: {
          ...state.skillScores,
          [topicId]: {
            topicId, topicName: topicId, masteryScore: 0, optimizationScore: 0,
            speedScore: 0, consistencyScore: 0, hintDependency: 0,
            lastUpdated: new Date().toISOString(),
            ...(state.skillScores[topicId] || {}),
            ...updates,
            lastUpdated: new Date().toISOString()
          }
        }
      })),

      recomputeRating: () => set(state => ({ rating: computeRating(state.sessions) })),
      setBehavioralTraits: (traits) => set({ behavioralTraits: traits }),
      setRevisionSchedule: (items) => set({ revisionSchedule: items }),
      setGenerating: (v) => set({ isGenerating: v }),
      setEvaluating: (v) => set({ isEvaluating: v }),
      setCurrentQuestion: (q) => set({ currentQuestion: q }),
      setCurrentReview: (r) => set({ currentReview: r }),
      setPersonalitySummary: (s) => set({ personalitySummary: s }),
      clearSessions: () => set({ sessions: [], rating: DEFAULT_RATING }),
    }),
    {
      name: 'patternlab-brain',
      partialize: (state) => ({
        skillScores: state.skillScores,
        sessions: state.sessions,
        rating: state.rating,
        behavioralTraits: state.behavioralTraits,
        revisionSchedule: state.revisionSchedule,
        personalitySummary: state.personalitySummary,
      })
    }
  )
);
