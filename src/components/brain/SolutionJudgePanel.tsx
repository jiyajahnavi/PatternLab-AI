import React, { useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Scale, Loader2, Send, ChevronDown, CheckCircle2, XCircle, AlertTriangle, Star, AlertCircle } from 'lucide-react';
import { useBrainStore, type BrainReviewResult } from '../../store/useBrainStore';
import { evaluateSolution } from '../../services/brain.service';
import { useProgressStore } from '../../store/useProgressStore';

const LANGUAGES = ['python', 'javascript', 'java', 'cpp', 'go', 'rust'];

const ScoreBar: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div>
    <div className="flex justify-between items-center mb-1">
      <span className="text-[10px] text-muted font-medium">{label}</span>
      <span className={`text-[10px] font-mono font-bold ${color}`}>{value}/100</span>
    </div>
    <div className="h-1.5 bg-border rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${
          value >= 75 ? 'bg-green-400' : value >= 50 ? 'bg-yellow-400' : 'bg-rose-400'
        }`}
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);

const VerdictIcon: React.FC<{ verdict: BrainReviewResult['verdict'] }> = ({ verdict }) => {
  if (verdict === 'correct') return <CheckCircle2 size={18} className="text-green-400" />;
  if (verdict === 'suboptimal') return <AlertTriangle size={18} className="text-yellow-400" />;
  return <XCircle size={18} className="text-rose-400" />;
};

export const SolutionJudgePanel: React.FC = () => {
  const [code, setCode] = useState('# Write your solution here\n');
  const [language, setLanguage] = useState('python');
  const [startTime] = useState(Date.now());
  const [hintsUsed] = useState(0);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [customProblem, setCustomProblem] = useState('');
  const [showProblemInput, setShowProblemInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const editorRef = useRef<any>(null);

  const { currentReview, currentQuestion, addSession } = useBrainStore();
  const { recordProblemSolved } = useProgressStore();

  const activeProblem = currentQuestion || (customProblem ? {
    id: 'custom-judge', title: 'Custom Problem', description: customProblem,
    level: 2, pattern: 'Custom', topic: 'custom',
    examples: [], constraints: [], hints: [], testCases: []
  } : null);

  const handleSubmit = async () => {
    if (!activeProblem || !code.trim() || code.trim() === '# Write your solution here') return;
    const newSubCount = submissionCount + 1;
    setSubmissionCount(newSubCount);
    setSubmitError(null);
    setIsSubmitting(true);
    const timeTaken = Math.round((Date.now() - startTime) / 1000);

    try {
      const review = await evaluateSolution(
        activeProblem,
        code,
        language,
        { timeTaken, hintsUsed, submissionCount: newSubCount }
      );

      if (review) {
        addSession({
          id: Math.random().toString(36).slice(2),
          questionId: activeProblem.id,
          questionTitle: activeProblem.title,
          topic: activeProblem.topic,
          pattern: activeProblem.pattern,
          difficulty: activeProblem.level === 1 ? 'beginner' : activeProblem.level === 2 ? 'intermediate' : 'advanced',
          timeTaken,
          hintsUsed,
          submissionCount: newSubCount,
          verdict: review.verdict,
          aiReviewSummary: review.mentorFeedback.slice(0, 200),
          codeQualityScore: review.codeQualityScore,
          optimizationScore: review.optimizationScore,
          edgeCaseScore: review.edgeCaseScore,
          timestamp: new Date().toISOString(),
        });

        if (review.verdict === 'correct' || review.verdict === 'suboptimal') {
          recordProblemSolved(
            activeProblem.topic,
            activeProblem.level as 1 | 2 | 3,
            activeProblem.id,
            activeProblem.pattern
          );
        }
      }
    } catch (err: any) {
      console.error('[SolutionJudge] error:', err);
      setSubmitError(err?.message || 'Evaluation failed. Check your API key in Settings.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const verdictConfig = {
    correct:    { label: 'Correct Solution',    bg: 'bg-green-500/10 border-green-500/30',  text: 'text-green-400' },
    suboptimal: { label: 'Suboptimal Solution', bg: 'bg-yellow-500/10 border-yellow-500/30', text: 'text-yellow-400' },
    wrong:      { label: 'Wrong Answer',        bg: 'bg-rose-500/10 border-rose-500/30',    text: 'text-rose-400' },
  };

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
            <Scale size={16} className="text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-primary">Solution Judge</h3>
            <p className="text-[10px] text-muted">Submit code for AI mentor evaluation</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-primary outline-none focus:border-violet-500/60 transition-colors appearance-none pr-7 cursor-pointer"
            >
              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Active problem indicator */}
      {activeProblem ? (
        <div className="px-6 py-2.5 bg-violet-500/5 border-b border-violet-500/10 flex items-center justify-between">
          <div className="text-xs font-semibold text-violet-300 truncate">
            📝 {activeProblem.title}
          </div>
          <span className="text-[10px] text-muted shrink-0 ml-2">
            {activeProblem.level === 1 ? 'Beginner' : activeProblem.level === 2 ? 'Intermediate' : 'Advanced'}
          </span>
        </div>
      ) : (
        <div className="px-6 py-2.5 bg-background/30 border-b border-border">
          <button
            onClick={() => setShowProblemInput(!showProblemInput)}
            className="text-[10px] text-muted hover:text-violet-400 transition-colors flex items-center gap-1"
          >
            <span>No question selected from generator.</span>
            <span className="text-violet-400 underline">Paste a problem description ↓</span>
          </button>
        </div>
      )}

      {/* Custom problem input */}
      {showProblemInput && !currentQuestion && (
        <div className="px-6 py-3 border-b border-border bg-background/20">
          <textarea
            value={customProblem}
            onChange={e => setCustomProblem(e.target.value)}
            placeholder="Paste the problem statement here..."
            rows={3}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-primary placeholder:text-muted/50 outline-none focus:border-violet-500/50 transition-colors resize-none"
          />
        </div>
      )}

      {/* Editor */}
      <div className="h-52 border-b border-border">
        <Editor
          height="100%"
          language={language}
          theme="vs-dark"
          value={code}
          onChange={val => setCode(val || '')}
          onMount={editor => { editorRef.current = editor; }}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: 'JetBrains Mono, monospace',
            scrollBeyondLastLine: false,
            padding: { top: 12 },
            lineNumbers: 'on',
            smoothScrolling: true,
          }}
        />
      </div>

      {/* Submit bar */}
      <div className="px-6 py-3 flex items-center justify-between bg-background/30 flex-col gap-2">
        {submitError && (
          <div className="w-full flex items-start gap-2 p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-lg">
            <AlertCircle size={12} className="text-rose-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-rose-300">{submitError}</p>
          </div>
        )}
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-4 text-[10px] text-muted">
            <span>Hints used: <span className="font-mono text-primary">{hintsUsed}</span></span>
            <span>Attempts: <span className="font-mono text-primary">{submissionCount}</span></span>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !activeProblem}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-xs hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-violet-500/20 active:scale-[0.98]"
          >
            {isSubmitting ? <><Loader2 size={12} className="animate-spin" /> Judging...</> : <><Send size={12} /> Submit</>}
          </button>
        </div>
      </div>

      {/* Review Result */}
      {currentReview && (
        <div className="border-t border-border bg-background/20 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Verdict */}
          <div className={`mx-6 mt-5 p-4 rounded-xl border ${verdictConfig[currentReview.verdict].bg} flex items-center gap-3`}>
            <VerdictIcon verdict={currentReview.verdict} />
            <div className="flex-1">
              <div className={`text-sm font-bold ${verdictConfig[currentReview.verdict].text}`}>
                {verdictConfig[currentReview.verdict].label}
              </div>
              <div className="flex gap-4 mt-1 text-[10px] text-muted">
                <span>Time: <span className="font-mono text-primary">{currentReview.timeComplexity}</span></span>
                <span>Space: <span className="font-mono text-primary">{currentReview.spaceComplexity}</span></span>
                <span>Target: <span className="font-mono text-violet-400">{currentReview.targetComplexity}</span></span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold font-mono text-primary">{currentReview.overallScore}</div>
              <div className="text-[9px] text-muted">/ 100</div>
            </div>
          </div>

          {/* Scores */}
          <div className="px-6 py-4 space-y-3">
            <ScoreBar label="Code Quality" value={currentReview.codeQualityScore} color="text-blue-400" />
            <ScoreBar label="Optimization" value={currentReview.optimizationScore} color="text-violet-400" />
            <ScoreBar label="Edge Cases" value={currentReview.edgeCaseScore} color="text-green-400" />
          </div>

          {/* Mentor Feedback */}
          <div className="px-6 pb-4">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-2">
              <Star size={10} /> Mentor Feedback
            </div>
            <div className="text-xs text-muted leading-relaxed bg-background/60 rounded-xl p-4 border border-border/50 whitespace-pre-line">
              {currentReview.mentorFeedback}
            </div>
          </div>

          {/* Improvement hints */}
          {currentReview.improvementHints?.length > 0 && (
            <div className="px-6 pb-4">
              <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2">Next Steps</div>
              <ul className="space-y-1.5">
                {currentReview.improvementHints.map((hint, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted">
                    <span className="text-violet-400 font-mono shrink-0">{i + 1}.</span>
                    {hint}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Better approach */}
          {currentReview.betterApproach && (
            <div className="px-6 pb-5">
              <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3">
                <div className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-1.5">💡 Better Approach</div>
                <p className="text-xs text-muted leading-relaxed">{currentReview.betterApproach}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
