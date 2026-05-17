import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Activity, Sparkles } from 'lucide-react';

interface GapsDrawerProps {
  isOpen: boolean;
  node: { id: string; title: string; type: 'pattern' | 'brain' | 'gap' } | null;
  onClose: () => void;
}

export const GapsDrawer: React.FC<GapsDrawerProps> = ({ isOpen, node, onClose }) => {
  // Mock gaps data
  const [gaps, setGaps] = useState([
    { id: 1, title: 'Edge Case Handlings', desc: 'Missed empty array checks in recent sliding window submissions.' },
    { id: 2, title: 'Time Complexity Tracking', desc: 'Inner loop invariant causing O(N^2) instead of O(N).' },
    { id: 3, title: 'Pointer Initialization', desc: 'Struggling with correct starting indices for two-pointer.' }
  ]);

  const handleFixGap = (id: number) => {
    setGaps(prev => prev.filter(gap => gap.id !== id));
  };

  return (
    <AnimatePresence>
      {isOpen && node?.type === 'gap' && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-background/40 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-surface border-l border-border shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-border flex items-start justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Activity size={18} className="text-blue-400" />
                  <span className="text-xs font-mono text-blue-400 uppercase tracking-wider">Growth Analytics</span>
                </div>
                <h2 className="text-2xl font-bold text-primary">{node.title}</h2>
                <p className="text-sm text-muted mt-2">
                  Identify and resolve specific friction points to achieve mastery in this topic.
                </p>
              </div>

              <button 
                onClick={onClose}
                className="p-2 rounded-full bg-background hover:bg-border text-muted hover:text-primary transition-colors relative z-10"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
              <AnimatePresence mode="popLayout">
                {gaps.length > 0 ? (
                  gaps.map((gap) => (
                    <motion.div
                      layout
                      key={gap.id}
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, height: 0, marginTop: 0, marginBottom: 0, overflow: 'hidden' }}
                      className="bg-background border border-border p-4 rounded-xl relative group hover:border-blue-500/30 transition-colors"
                    >
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <h4 className="text-primary font-medium">{gap.title}</h4>
                          <p className="text-sm text-muted mt-1 leading-relaxed">{gap.desc}</p>
                        </div>
                        <button
                          onClick={() => handleFixGap(gap.id)}
                          className="self-center flex items-center justify-center w-8 h-8 rounded-full border border-border text-muted hover:bg-blue-500/10 hover:border-blue-500/50 hover:text-blue-400 transition-all shrink-0"
                          title="Mark as resolved"
                        >
                          <CheckCircle size={16} />
                        </button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-12 text-center"
                  >
                    <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                      <Sparkles size={24} className="text-accent" />
                    </div>
                    <h3 className="text-lg font-medium text-primary">Mastery Achieved!</h3>
                    <p className="text-sm text-muted mt-2 max-w-[250px]">
                      You've cleared all identified growth gaps for this topic. Fantastic work.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Footer */}
            {gaps.length > 0 && (
              <div className="p-6 border-t border-border bg-background/50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Total Gaps</span>
                  <span className="font-mono text-primary font-bold bg-surface px-2 py-1 rounded border border-border">
                    {gaps.length}
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
