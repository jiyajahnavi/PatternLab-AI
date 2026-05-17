import React from 'react';
import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';

interface BrainNodeProps {
  onClick: () => void;
}

export const BrainNode: React.FC<BrainNodeProps> = ({ onClick }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
      onClick={onClick}
      className="group relative flex items-center gap-3 bg-violet-500/10 border border-violet-500/30 px-4 py-2 rounded-xl hover:bg-violet-500/20 hover:border-violet-500/50 transition-all shadow-[0_0_15px_rgba(124,111,247,0.1)] hover:shadow-[0_0_25px_rgba(124,111,247,0.3)]"
    >
      <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center relative">
        <div className="absolute inset-0 bg-violet-400 rounded-lg animate-ping opacity-20" />
        <Brain size={16} className="text-violet-400" />
      </div>
      <div className="flex flex-col items-start">
        <span className="text-xs font-mono text-violet-400/80 uppercase tracking-wider">AI Guide</span>
        <span className="text-sm font-semibold text-violet-100">Brain</span>
      </div>
    </motion.button>
  );
};
