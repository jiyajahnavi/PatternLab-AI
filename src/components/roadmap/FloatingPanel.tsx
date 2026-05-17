import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Network, Lock, BookOpen } from 'lucide-react';

interface FloatingPanelProps {
  isOpen: boolean;
  node: { id: string; title: string; type: 'pattern' | 'brain' | 'gap' } | null;
  onClose: () => void;
}

export const FloatingPanel: React.FC<FloatingPanelProps> = ({ isOpen, node, onClose }) => {
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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-lg bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="relative h-32 bg-gradient-to-br from-accent/20 to-surface p-6 overflow-hidden">
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
                  <h3 className="text-2xl font-bold text-primary">{node.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-mono text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                      PATTERN CORE
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Decorative background glow */}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-accent/30 rounded-full blur-3xl pointer-events-none" />
            </div>

            {/* Content Body Placeholder */}
            <div className="p-6 min-h-[250px] flex flex-col">
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-border/50 flex items-center justify-center text-muted">
                  <Lock size={24} />
                </div>
                <div>
                  <h4 className="text-primary font-medium mb-1">Practice Area Locked</h4>
                  <p className="text-sm text-muted max-w-[280px]">
                    Questions and practice modules for this pattern will be inserted later.
                  </p>
                </div>
              </div>

              <button className="w-full mt-6 py-3 rounded-xl bg-background border border-border text-muted hover:text-primary hover:border-accent/50 transition-colors flex items-center justify-center gap-2 text-sm font-medium">
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
