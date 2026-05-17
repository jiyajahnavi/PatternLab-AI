import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Network, Lock, BookOpen, ExternalLink } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

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

export const FloatingPanel: React.FC<FloatingPanelProps> = ({ isOpen, node, onClose }) => {
  const [problems, setProblems] = useState<DatabaseProblem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchProblems() {
      if (!isOpen || !node || node.type !== 'pattern') return;
      
      setLoading(true);
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-lg bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="relative shrink-0 bg-gradient-to-br from-accent/20 to-surface p-6 overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <button 
                  onClick={onClose}
                  className="p-2 rounded-full bg-background/50 hover:bg-background text-muted hover:text-primary transition-colors backdrop-blur-md"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="relative z-10 flex items-center gap-4 h-full">
                <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center shadow-lg">
                  <Network size={24} className="text-accent" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-primary leading-tight">{node.title}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-mono text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20 tracking-wider">
                      PATTERN CORE
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Decorative background glow */}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-accent/30 rounded-full blur-3xl pointer-events-none" />
            </div>

            {/* Content Body */}
            <div className="p-6 flex-1 overflow-y-auto min-h-[250px] flex flex-col gap-4">
              {loading ? (
                <div className="flex-1 flex items-center justify-center text-muted">
                  Loading problems...
                </div>
              ) : problems.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted uppercase tracking-wider mb-4">Practice Problems</h4>
                  {problems.map((prob) => (
                    <a 
                      key={prob.id}
                      href={prob.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between p-3 rounded-xl bg-background border border-border hover:border-accent/50 transition-colors"
                    >
                      <div className="flex flex-col gap-1 pr-4">
                        <span className="text-sm font-medium text-primary/90 group-hover:text-primary transition-colors line-clamp-1">{prob.title}</span>
                        <div className="flex gap-2 items-center text-xs">
                          <span className={`px-2 py-0.5 rounded-sm font-medium ${
                            prob.difficulty === 'Easy' ? 'text-green-400 bg-green-400/10' :
                            prob.difficulty === 'Medium' ? 'text-yellow-400 bg-yellow-400/10' :
                            prob.difficulty === 'Hard' ? 'text-red-400 bg-red-400/10' :
                            'text-muted bg-muted/10'
                          }`}>
                            {prob.difficulty}
                          </span>
                          <span className="text-muted/60">{prob.platform}</span>
                        </div>
                      </div>
                      <ExternalLink size={16} className="text-muted group-hover:text-accent transition-colors shrink-0" />
                    </a>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-border/50 flex items-center justify-center text-muted">
                    <Lock size={24} />
                  </div>
                  <div>
                    <h4 className="text-primary font-medium mb-1">No Problems Yet</h4>
                    <p className="text-sm text-muted max-w-[280px]">
                      Questions for this pattern will be added soon.
                    </p>
                  </div>
                </div>
              )}

              <button className="w-full mt-auto py-3 rounded-xl bg-background border border-border text-muted hover:text-primary hover:border-accent/50 transition-colors flex items-center justify-center gap-2 text-sm font-medium shrink-0">
                <BookOpen size={16} />
                Read Pattern Theory
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
