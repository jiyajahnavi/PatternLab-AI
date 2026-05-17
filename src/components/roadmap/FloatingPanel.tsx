import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Network, Lock, BookOpen, ExternalLink, Check, Zap } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { useProgressStore } from '../../store/useProgressStore';
import { useUserStore } from '../../store/useUserStore';

interface FloatingPanelProps {
  isOpen: boolean;
  node: { id: string; title: string; type: 'pattern' | 'brain' | 'gap' } | null;
  onClose: () => void;
}

interface DatabaseProblem {
  id: string;
  title: string;
  difficulty: string;
  platform: string;
  url: string;
  order_index: number;
}

const DIFFICULTY_STYLES: Record<string, string> = {
  Easy:   'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20',
  Medium: 'text-amber-400   bg-amber-400/10   border border-amber-400/20',
  Hard:   'text-rose-400    bg-rose-400/10    border border-rose-400/20',
};

export const FloatingPanel: React.FC<FloatingPanelProps> = ({ isOpen, node, onClose }) => {
  const [problems, setProblems]   = useState<DatabaseProblem[]>([]);
  const [loading, setLoading]     = useState(false);
  const { solvedProblems, toggleProblemCompletion } = useProgressStore();
  const { user } = useUserStore();

  /* ── Escape key ── */
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) document.addEventListener('keydown', handleKeyDown);
    return ()  => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  /* ── Prevent page scroll when drawer open ── */
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  /* ── Fetch problems ── */
  useEffect(() => {
    async function fetchProblems() {
      if (!isOpen || !node || node.type !== 'pattern') return;
      setLoading(true);
      setProblems([]);
      try {
        const { data, error } = await supabase
          .from('problems')
          .select('*')
          .eq('pattern_id', node.id)
          .order('order_index', { ascending: true });
        if (error) throw error;
        setProblems(data as DatabaseProblem[]);
      } catch (err) {
        console.error('Error fetching problems:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProblems();
  }, [isOpen, node]);

  if (node?.type !== 'pattern') return null;

  const solvedCount = problems.filter(p => solvedProblems.includes(p.id)).length;
  const progressPct = problems.length > 0 ? Math.round((solvedCount / problems.length) * 100) : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── DIM OVERLAY ── */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[3px]"
          />

          {/* ── RIGHT DRAWER ── */}
          <motion.aside
            key="drawer"
            initial={{ x: '100%', opacity: 0.6 }}
            animate={{ x: 0,      opacity: 1   }}
            exit={{   x: '100%', opacity: 0   }}
            transition={{ duration: 0.38, ease: [0.32, 0.72, 0, 1] }}
            className="fixed top-0 right-0 z-[60] h-screen
                       w-full sm:w-[480px] lg:w-[520px]
                       flex flex-col
                       bg-[#0B0B12] border-l border-white/[0.07]
                       shadow-[-24px_0_80px_rgba(0,0,0,0.6)]"
            onClick={e => e.stopPropagation()}
          >

            {/* ══ HEADER (sticky) ══ */}
            <header className="shrink-0 relative px-6 pt-6 pb-5
                               border-b border-white/[0.06]
                               bg-gradient-to-b from-[#0F0F1A] to-[#0B0B12]">

              {/* Close button */}
              <button
                onClick={onClose}
                aria-label="Close panel"
                className="absolute top-5 right-5 z-20
                           w-8 h-8 rounded-full flex items-center justify-center
                           bg-white/5 hover:bg-white/10
                           border border-white/10 hover:border-white/20
                           text-white/50 hover:text-white
                           transition-all duration-150"
              >
                <X size={15} strokeWidth={2.5} />
              </button>

              {/* Pattern icon + title */}
              <div className="flex items-start gap-4 pr-10">
                <div className="shrink-0 w-11 h-11 rounded-xl
                                bg-accent/10 border border-accent/25
                                flex items-center justify-center
                                shadow-[0_0_20px_rgba(99,102,241,0.15)]">
                  <Network size={20} className="text-accent" />
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-mono text-accent/70 tracking-[0.15em] uppercase mb-1">
                    Pattern Core
                  </p>
                  <h2 className="text-lg font-bold text-white leading-snug truncate">
                    {node.title}
                  </h2>
                </div>
              </div>

              {/* Progress bar */}
              {problems.length > 0 && (
                <div className="mt-5">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
                      Progress
                    </span>
                    <span className={`text-[10px] font-mono font-semibold tracking-wider ${
                      progressPct === 100 ? 'text-emerald-400' : 'text-white/50'
                    }`}>
                      {solvedCount} / {problems.length} &nbsp;·&nbsp; {progressPct}%
                    </span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPct}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className={`h-full rounded-full ${
                        progressPct === 100
                          ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]'
                          : 'bg-accent'
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* Decorative glow */}
              <div className="absolute -top-6 -right-6 w-32 h-32
                              bg-accent/10 rounded-full blur-3xl pointer-events-none" />
            </header>

            {/* ══ SCROLLABLE BODY ══ */}
            <div
              className="flex-1 overflow-y-auto overscroll-contain px-6 py-5
                         [&::-webkit-scrollbar]:w-[4px]
                         [&::-webkit-scrollbar-track]:bg-transparent
                         [&::-webkit-scrollbar-thumb]:bg-white/10
                         [&::-webkit-scrollbar-thumb]:rounded-full
                         [&::-webkit-scrollbar-thumb:hover]:bg-white/20"
            >
              {loading ? (
                /* Skeleton loader */
                <div className="flex flex-col gap-3 pt-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i}
                         className="h-[68px] rounded-xl bg-white/[0.03] border border-white/[0.05]
                                    animate-pulse" />
                  ))}
                </div>

              ) : problems.length > 0 ? (
                <div className="space-y-2.5">
                  <p className="text-[10px] font-mono text-white/25 uppercase tracking-[0.15em] mb-4">
                    Practice Problems
                  </p>

                  {problems.map((prob, idx) => {
                    const isSolved = solvedProblems.includes(prob.id);
                    return (
                      <motion.div
                        key={prob.id}
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04, duration: 0.25, ease: 'easeOut' }}
                        className={`group flex items-center gap-3 px-4 py-3.5 rounded-xl
                                    border transition-all duration-200 ${
                          isSolved
                            ? 'bg-emerald-500/[0.04] border-emerald-500/20'
                            : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.12]'
                        }`}
                      >
                        {/* Checkbox */}
                        <button
                          onClick={() => user && toggleProblemCompletion(user.id, prob.id, !isSolved)}
                          className={`shrink-0 w-5 h-5 rounded-md flex items-center justify-center
                                      border transition-all duration-200 ${
                            isSolved
                              ? 'bg-emerald-500 border-emerald-500 text-black shadow-[0_0_10px_rgba(52,211,153,0.3)]'
                              : 'bg-transparent border-white/20 hover:border-accent'
                          }`}
                        >
                          {isSolved && <Check size={11} strokeWidth={3} />}
                        </button>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate transition-colors ${
                            isSolved ? 'text-emerald-400/70 line-through' : 'text-white/80 group-hover:text-white'
                          }`}>
                            {prob.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {prob.difficulty && (
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold tracking-wide ${
                                DIFFICULTY_STYLES[prob.difficulty] ?? 'text-white/40 bg-white/5'
                              }`}>
                                {prob.difficulty}
                              </span>
                            )}
                            {prob.platform && (
                              <span className="text-[10px] text-white/25">{prob.platform}</span>
                            )}
                          </div>
                        </div>

                        {/* External link */}
                        {prob.url && (
                          <a
                            href={prob.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="shrink-0 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                          >
                            <ExternalLink size={13} className={`transition-colors ${
                              isSolved
                                ? 'text-emerald-400/40 hover:text-emerald-400'
                                : 'text-white/30 hover:text-accent'
                            }`} />
                          </a>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

              ) : (
                /* Empty state */
                <div className="flex flex-col items-center justify-center text-center gap-4 h-full min-h-[280px]">
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.07]
                                  flex items-center justify-center text-white/20">
                    <Lock size={22} />
                  </div>
                  <div>
                    <h4 className="text-white/70 font-semibold mb-1">No Problems Yet</h4>
                    <p className="text-sm text-white/30 max-w-[240px] leading-relaxed">
                      Questions for this pattern will be added soon.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ══ FOOTER (sticky) ══ */}
            <footer className="shrink-0 px-6 py-4 border-t border-white/[0.06]
                               bg-[#0B0B12]">
              <button className="w-full py-2.5 rounded-xl flex items-center justify-center gap-2
                                 text-sm font-medium text-white/40 hover:text-white/70
                                 bg-white/[0.03] hover:bg-white/[0.06]
                                 border border-white/[0.06] hover:border-white/[0.12]
                                 transition-all duration-200">
                <BookOpen size={14} />
                Read Pattern Theory
              </button>
            </footer>

          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
