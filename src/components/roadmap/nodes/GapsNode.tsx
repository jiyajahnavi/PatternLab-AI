import React from 'react';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';

interface GapsNodeProps {
  onClick: () => void;
}

export const GapsNode: React.FC<GapsNodeProps> = ({ onClick }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
      onClick={onClick}
      className="group relative flex items-center gap-3 bg-surface border border-border px-4 py-2 rounded-xl hover:bg-background hover:border-blue-500/50 transition-all shadow-sm"
    >
      <div className="w-8 h-8 rounded-lg bg-background border border-border group-hover:border-blue-500/30 flex items-center justify-center transition-colors">
        <Activity size={16} className="text-muted group-hover:text-blue-400 transition-colors" />
      </div>
      <div className="flex flex-col items-start">
        <span className="text-xs font-mono text-muted group-hover:text-blue-400/80 uppercase tracking-wider transition-colors">Analytics</span>
        <span className="text-sm font-semibold text-primary/80 group-hover:text-primary transition-colors">Gaps</span>
      </div>
    </motion.button>
  );
};
