import { GoogleGenerativeAI } from '@google/generative-ai';
import { useSettingsStore } from '../store/useSettingsStore';
import { useProgressStore } from '../store/useProgressStore';
import { useBrainStore, type BrainDifficulty, type BrainReviewResult, type BehavioralTrait, type RevisionItem } from '../store/useBrainStore';
import type { Problem } from '../store/useProblemStore';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getClient(): GoogleGenerativeAI {
  const settings = useSettingsStore.getState();
  const key = settings.apiKeys.gemini || import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) throw new Error('No Gemini API key found. Please add it in Settings.');
  return new GoogleGenerativeAI(key);
}

function getModel(client: GoogleGenerativeAI, systemInstruction: string) {
  const settings = useSettingsStore.getState();
  let modelName = settings.model.startsWith('gemini') ? settings.model : 'gemini-flash-latest';
  if ((modelName as string) === 'gemini-1.5-flash') modelName = 'gemini-flash-latest';
  if ((modelName as string) === 'gemini-1.5-pro') modelName = 'gemini-pro-latest';
  return client.getGenerativeModel({ model: modelName, systemInstruction });
}

async function callBrain(systemInstruction: string, userPrompt: string): Promise<string> {
  const client = getClient();
  const model = getModel(client, systemInstruction);
  const result = await model.generateContent(userPrompt);
  return result.response.text();
}

function extractJSON(text: string): any {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) {
    try { return JSON.parse(fence[1].trim()); } catch {}
  }
  try { return JSON.parse(text.trim()); } catch {}
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Adaptive Question Generator
// ─────────────────────────────────────────────────────────────────────────────

const QUESTION_SYSTEM = `You are PatternLab Brain, an expert DSA question generator.
Your ONLY job is to generate original, never-before-seen DSA practice problems.
Do NOT copy LeetCode questions. Generate genuinely new, creative problems.
Always respond with a single JSON object — no extra text, no markdown prose around it.
The JSON must exactly match the Problem schema provided.`;

export async function generateAdaptiveQuestion(
  topic: string,
  difficulty: BrainDifficulty,
  onStream?: (partial: string) => void
): Promise<Problem | null> {
  const progress = useProgressStore.getState();
  const brain = useBrainStore.getState();

  const topicData = Object.values(progress.topics).find(t =>
    t.name.toLowerCase() === topic.toLowerCase() || t.id === topic
  );
  const patterns = topicData?.patterns?.join(', ') || 'core patterns';

  const skillScore = brain.skillScores[topic.toLowerCase()];
  const weaknesses = brain.sessions
    .filter(s => s.topic.toLowerCase() === topic.toLowerCase() && s.verdict !== 'correct')
    .map(s => s.pattern)
    .slice(0, 3)
    .join(', ') || 'none identified';

  const difficultyGuide = {
    beginner: 'Simple, focused on one pattern. Clear input/output. No tricks.',
    intermediate: 'Combines 2 patterns. Requires optimization thinking. Some edge cases.',
    advanced: 'Multi-pattern fusion. Hard constraints. Requires O(n log n) or better. Non-obvious approach.',
  }[difficulty];

  const userPrompt = `Generate a ${difficulty.toUpperCase()} level DSA problem for topic: "${topic}".
Relevant patterns: ${patterns}
User weakness areas: ${weaknesses}
Current mastery score: ${skillScore?.masteryScore ?? 0}/100
Difficulty guide: ${difficultyGuide}

Return ONLY this JSON schema (no extra text):
{
  "id": "unique-slug-kebab-case",
  "title": "Problem Title",
  "description": "Full problem statement in markdown. Include context, clear task definition.",
  "level": ${difficulty === 'beginner' ? 1 : difficulty === 'intermediate' ? 2 : 3},
  "pattern": "primary pattern name",
  "topic": "${topic.toLowerCase()}",
  "examples": [
    {"input": "...", "output": "...", "explanation": "..."},
    {"input": "...", "output": "..."}
  ],
  "constraints": ["constraint 1", "constraint 2", "..."],
  "hints": ["hint 1 (vague)", "hint 2 (more specific)", "hint 3 (near solution)"],
  "testCases": [
    {"id": "tc1", "input": "...", "expectedOutput": "..."},
    {"id": "tc2", "input": "...", "expectedOutput": "..."},
    {"id": "tc3", "input": "edge case input", "expectedOutput": "..."}
  ],
  "metadata": {
    "expectedComplexity": "O(?)",
    "spaceComplexity": "O(?)",
    "concepts": ["concept1", "concept2"],
    "difficulty": "${difficulty}"
  }
}`;

  try {
    useBrainStore.getState().setGenerating(true);
    const raw = await callBrain(QUESTION_SYSTEM, userPrompt);
    console.log('[brain.service] raw response:', raw.slice(0, 300));
    const parsed = extractJSON(raw);
    if (parsed && parsed.id && parsed.title) {
      useBrainStore.getState().setCurrentQuestion(parsed);
      return parsed as Problem;
    }
    // If parsing failed, throw so the component can display the error
    throw new Error(`Brain returned invalid JSON. Raw: ${raw.slice(0, 200)}`);
  } catch (err) {
    useBrainStore.getState().setGenerating(false);
    console.error('[brain.service] generateAdaptiveQuestion error:', err);
    throw err; // Re-throw so the component's try/catch handles it
  } finally {
    useBrainStore.getState().setGenerating(false);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Solution Judge / Evaluator
// ─────────────────────────────────────────────────────────────────────────────

const JUDGE_SYSTEM = `You are PatternLab Brain's Solution Judge — a senior DSA engineer + mentor.
Evaluate code with the eye of a FAANG interviewer: correctness, complexity, readability, edge cases, pattern usage.
Be honest, specific, and pedagogically valuable.

CRITICAL RULES:
1. If the code does NOT solve the problem correctly, the verdict MUST be "wrong".
2. If the verdict is "wrong", ALL SCORES (overallScore, codeQualityScore, optimizationScore, edgeCaseScore) MUST BE 0.
3. Be strict with complexity. If it's worse than target, it's "suboptimal".
4. Always respond with a single JSON object matching the BrainReviewResult schema.`;

export async function evaluateSolution(
  problem: Problem,
  code: string,
  language: string,
  metrics: { timeTaken: number; hintsUsed: number; submissionCount: number }
): Promise<BrainReviewResult | null> {
  const userPrompt = `
Problem Title: ${problem.title}
Topic: ${problem.topic}
Pattern: ${problem.pattern}
Level: ${problem.level}
Expected Complexity: ${(problem as any).metadata?.expectedComplexity ?? 'O(n)'}

User's Code (${language}):
\`\`\`${language}
${code}
\`\`\`

Behavioral Metrics:
- Time taken: ${metrics.timeTaken}s
- Hints used: ${metrics.hintsUsed}
- Submission attempts: ${metrics.submissionCount}

Evaluate and return ONLY this JSON (no extra text):
{
  "verdict": "correct" | "suboptimal" | "wrong",
  "overallScore": 0-100,
  "codeQualityScore": 0-100,
  "optimizationScore": 0-100,
  "edgeCaseScore": 0-100,
  "timeComplexity": "O(?)",
  "spaceComplexity": "O(?)",
  "targetComplexity": "O(?)",
  "mentorFeedback": "Multi-paragraph mentor-style feedback. Be specific about what's good and what to improve. Reference the code directly.",
  "improvementHints": ["specific actionable hint 1", "hint 2", "hint 3"],
  "lineAnnotations": [
    {"line": <number>, "severity": "error"|"warning"|"success"|"info", "message": "specific annotation"}
  ],
  "betterApproach": "Optional: describe a fundamentally better approach if one exists"
}`;

  try {
    useBrainStore.getState().setEvaluating(true);
    const raw = await callBrain(JUDGE_SYSTEM, userPrompt);
    console.log('[brain.service] judge raw:', raw.slice(0, 200));
    const parsed = extractJSON(raw) as BrainReviewResult | null;
    if (parsed && parsed.verdict) {
      // Safety override: Force 0 scores for wrong answers
      if (parsed.verdict === 'wrong') {
        parsed.overallScore = 0;
        parsed.codeQualityScore = 0;
        parsed.optimizationScore = 0;
        parsed.edgeCaseScore = 0;
      }
      useBrainStore.getState().setCurrentReview(parsed);
      return parsed;
    }
    throw new Error('Brain returned invalid review JSON.');
  } catch (err) {
    console.error('[brain.service] evaluateSolution error:', err);
    throw err;
  } finally {
    useBrainStore.getState().setEvaluating(false);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Skill Profile Analyzer
// ─────────────────────────────────────────────────────────────────────────────

const PROFILE_SYSTEM = `You are PatternLab Brain's behavioral analyst.
Analyze the user's DSA solving patterns and produce concise, actionable insights.
Focus on identifying real patterns — not generic advice. Be specific and data-driven.
Respond ONLY with JSON.`;

export async function analyzeSkillProfile(): Promise<void> {
  const brain = useBrainStore.getState();
  const progress = useProgressStore.getState();

  if (brain.sessions.length < 2) {
    brain.setBehavioralTraits([
      { id: 'new-user', trait: 'Just Getting Started', description: 'Complete a few Brain sessions to unlock behavioral insights.', type: 'neutral' }
    ]);
    return;
  }

  const sessionSummary = brain.sessions.slice(0, 15).map(s =>
    `${s.topic}/${s.pattern} | ${s.difficulty} | ${s.verdict} | hints:${s.hintsUsed} | time:${s.timeTaken}s | subs:${s.submissionCount}`
  ).join('\n');

  const topicsSolved = Object.values(progress.topics)
    .filter(t => t.level1.solved > 0 || t.level2.solved > 0 || t.level3.solved > 0)
    .map(t => `${t.name}: L1=${t.level1.solved}/${t.level1.total} L2=${t.level2.solved}/${t.level2.total}`)
    .join(', ');

  const userPrompt = `
Recent Brain sessions (most recent first):
${sessionSummary}

Progress store topics: ${topicsSolved}

Analyze and return ONLY this JSON:
{
  "traits": [
    {
      "id": "unique-id",
      "trait": "Short trait name (4-6 words)",
      "description": "One sentence, specific and data-driven",
      "type": "strength" | "weakness" | "neutral"
    }
  ],
  "revisionSchedule": [
    {
      "topicId": "topic-id",
      "topicName": "Topic Name",
      "daysSinceAttempt": <number>,
      "urgency": "critical" | "high" | "medium" | "low",
      "reason": "One sentence reason"
    }
  ],
  "personalitySummary": "One sentence describing the user's overall DSA problem-solving personality"
}

Provide 4-6 traits and 3-5 revision items.`;

  try {
    const raw = await callBrain(PROFILE_SYSTEM, userPrompt);
    const parsed = extractJSON(raw);
    if (parsed) {
      if (parsed.traits) brain.setBehavioralTraits(parsed.traits);
      if (parsed.revisionSchedule) brain.setRevisionSchedule(parsed.revisionSchedule);
      if (parsed.personalitySummary) brain.setPersonalitySummary(parsed.personalitySummary);
    }
  } catch (err) {
    console.error('[brain.service] analyzeSkillProfile error:', err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Revision Schedule Generator (lightweight, no AI call needed)
// ─────────────────────────────────────────────────────────────────────────────

export function generateLocalRevisionSchedule(): RevisionItem[] {
  const progress = useProgressStore.getState();
  const now = new Date();
  const items: RevisionItem[] = [];

  Object.values(progress.topics).forEach(topic => {
    if (!topic.lastAttempted) return;
    const last = new Date(topic.lastAttempted);
    const days = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

    const totalSolved = topic.level1.solved + topic.level2.solved + topic.level3.solved;
    if (totalSolved === 0) return;

    let urgency: RevisionItem['urgency'] = 'low';
    let reason = '';

    if (days >= 21) { urgency = 'critical'; reason = `Not practiced in ${days} days — risk of forgetting`; }
    else if (days >= 14) { urgency = 'high'; reason = `${days} days since last attempt — needs reinforcement`; }
    else if (days >= 7) { urgency = 'medium'; reason = `A week since last session — good time to revisit`; }
    else if (days >= 3) { urgency = 'low'; reason = `Minor refresh recommended`; }
    else return;

    items.push({ topicId: topic.id, topicName: topic.name, daysSinceAttempt: days, urgency, reason });
  });

  return items.sort((a, b) => b.daysSinceAttempt - a.daysSinceAttempt).slice(0, 5);
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Brain Memory Context (for ChatPage enrichment)
// ─────────────────────────────────────────────────────────────────────────────

export function getBrainMemoryContext(): string {
  const { sessions, rating, personalitySummary, behavioralTraits } = useBrainStore.getState();
  if (sessions.length === 0) return '';

  const recentTopics = [...new Set(sessions.slice(0, 5).map(s => s.topic))].join(', ');
  const weakTopics = behavioralTraits.filter(t => t.type === 'weakness').map(t => t.trait).join('; ');
  const strongTopics = behavioralTraits.filter(t => t.type === 'strength').map(t => t.trait).join('; ');

  return [
    `[Brain Rating: ${rating.overall} (${rating.tier}, Top ${100 - rating.percentileRank}%)]`,
    personalitySummary ? `[Personality: ${personalitySummary}]` : '',
    recentTopics ? `[Recently practiced: ${recentTopics}]` : '',
    strongTopics ? `[Strengths: ${strongTopics}]` : '',
    weakTopics ? `[Weaknesses: ${weakTopics}]` : '',
  ].filter(Boolean).join('\n');
}
