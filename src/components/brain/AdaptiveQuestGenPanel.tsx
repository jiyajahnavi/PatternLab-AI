import React, { useState } from 'react';
import { Sparkles, ChevronDown, Loader2, ArrowRight, RefreshCw, Info, AlertCircle } from 'lucide-react';
import { useBrainStore, type BrainDifficulty } from '../../store/useBrainStore';
import { generateAdaptiveQuestion } from '../../services/brain.service';
import { useNavigate } from 'react-router-dom';
import { useProblemStore } from '../../store/useProblemStore';

const TOPICS = [
  'Arrays', 'Strings', 'Binary Search', 'Stack', 'Queue',
  'Recursion', 'Linked List', 'HashMap', 'Heap', 'Tree',
  'Binary Search Tree', 'Graph', 'Backtracking', 'Greedy',
  'Dynamic Programming', 'Trie', 'Bit Manipulation',
];

const DIFFICULTIES: { id: BrainDifficulty; label: string; color: string; desc: string }[] = [
  { id: 'beginner',     label: 'Beginner',     color: 'text-green-400 border-green-500/40 bg-green-500/10',  desc: 'Single pattern, clear I/O' },
  { id: 'intermediate', label: 'Intermediate', color: 'text-blue-400 border-blue-500/40 bg-blue-500/10',    desc: '2 patterns, optimization' },
  { id: 'advanced',     label: 'Advanced',     color: 'text-rose-400 border-rose-500/40 bg-rose-500/10',    desc: 'Multi-pattern, hard constraints' },
];

export const AdaptiveQuestGenPanel: React.FC = () => {
  const [topic, setTopic] = useState('Arrays');
  const [difficulty, setDifficulty] = useState<BrainDifficulty>('beginner');
  // Local state — reliable, doesn't depend on store re-render timing
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { currentQuestion, setCurrentQuestion } = useBrainStore();
  const { setProblem } = useProblemStore();
  const navigate = useNavigate();

  const handleGenerate = async () => {
    setError(null);
    setCurrentQuestion(null);
    setIsLoading(true);
    try {
      const result = await generateAdaptiveQuestion(topic, difficulty);
      if (!result) {
        setError('Brain returned an unexpected response format. Please try again.');
      }
    } catch (err: any) {
      console.error('[AdaptiveQuestGen] error:', err);
      setError(err?.message || 'Failed to generate question. Check your Gemini API key in Settings.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSolveInIDE = () => {
    if (!currentQuestion) return;
    setProblem(currentQuestion);
    navigate(`/problem/${currentQuestion.id}`);
  };

  const difficultyBorderClass = (id: BrainDifficulty) =>
    difficulty === id ? DIFFICULTIES.find(d => d.id === id)!.color : 'text-muted border-border bg-transparent';

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 relative overflow-hidden">
      <div className="absolute bottom-0 left-0 w-64 h-32 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
          <Sparkles size={16} className="text-violet-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-primary">Adaptive Question Generator</h3>
          <p className="text-[10px] text-muted">AI generates original problems tailored to your level</p>
        </div>
      </div>

      {/* Topic Selector */}
      <div className="mb-4">
        <label className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-2">Topic</label>
        <div className="relative">
          <select
            value={topic}
            onChange={e => setTopic(e.target.value)}
            disabled={isLoading}
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-primary outline-none focus:border-violet-500/60 transition-colors appearance-none cursor-pointer disabled:opacity-60"
          >
            {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        </div>
      </div>

      {/* Difficulty */}
      <div className="mb-5">
        <label className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-2">Difficulty</label>
        <div className="grid grid-cols-3 gap-2">
          {DIFFICULTIES.map(d => (
            <button
              key={d.id}
              onClick={() => setDifficulty(d.id)}
              disabled={isLoading}
              className={`flex flex-col p-2.5 rounded-xl border text-left transition-all disabled:opacity-60 ${difficultyBorderClass(d.id)}`}
            >
              <span className="text-xs font-bold">{d.label}</span>
              <span className="text-[9px] mt-0.5 opacity-70">{d.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 flex items-start gap-2.5 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl animate-in fade-in duration-200">
          <AlertCircle size={14} className="text-rose-400 shrink-0 mt-0.5" />
          <p className="text-xs text-rose-300 leading-relaxed">{error}</p>
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-sm hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/20 active:scale-[0.98]"
      >
        {isLoading ? (
          <><Loader2 size={16} className="animate-spin" /> Generating question...</>
        ) : (
          <><Sparkles size={16} /> Generate Question</>
        )}
      </button>

      {/* Result */}
      {currentQuestion && !isLoading && (
        <div className="mt-5 bg-background/60 border border-violet-500/20 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Metadata pills */}
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/15 text-violet-400 border border-violet-500/30">
              {currentQuestion.topic}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
              {currentQuestion.pattern}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
              currentQuestion.level === 1 ? 'bg-green-500/15 text-green-400 border-green-500/30' :
              currentQuestion.level === 2 ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' :
              'bg-rose-500/15 text-rose-400 border-rose-500/30'
            }`}>
              Level {currentQuestion.level}
            </span>
            {(currentQuestion as any).metadata?.expectedComplexity && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                {(currentQuestion as any).metadata.expectedComplexity}
              </span>
            )}
          </div>

          {/* Title */}
          <h4 className="text-sm font-bold text-primary leading-snug">{currentQuestion.title}</h4>

          {/* Description preview */}
          <p className="text-xs text-muted line-clamp-3 leading-relaxed">
            {currentQuestion.description?.replace(/[*#`]/g, '').slice(0, 180)}...
          </p>

          {/* Concepts */}
          {(currentQuestion as any).metadata?.concepts && (
            <div className="flex items-start gap-2 text-[10px] text-muted">
              <Info size={10} className="mt-0.5 shrink-0 text-violet-400" />
              <span>Concepts: {(currentQuestion as any).metadata.concepts.join(', ')}</span>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSolveInIDE}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-violet-500/20 border border-violet-500/40 text-violet-400 rounded-lg text-xs font-bold hover:bg-violet-500/30 transition-all"
            >
              Solve in IDE <ArrowRight size={12} />
            </button>
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="px-3 py-2 bg-background border border-border text-muted rounded-lg text-xs hover:text-primary hover:border-accent/30 transition-all disabled:opacity-50"
              title="Regenerate"
            >
              <RefreshCw size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
