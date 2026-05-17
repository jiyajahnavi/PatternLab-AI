import React from 'react';
import { motion } from 'framer-motion';
import type { PatternData } from '../data';
import { Network } from 'lucide-react';

interface PatternNodeProps {
  pattern: PatternData;
  index: number;
  onClick: () => void;
}

export const PatternNode: React.FC<PatternNodeProps> = ({ pattern, index, onClick }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, type: "spring", stiffness: 300 }}
      onClick={onClick}
      className="group relative flex items-center gap-3 bg-surface border border-border px-4 py-2.5 rounded-full hover:border-primary/50 transition-colors shadow-sm"
    >
      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 rounded-full transition-opacity" />
      <div className="w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center group-hover:border-primary/50 transition-colors">
        <Network size={12} className="text-muted group-hover:text-primary transition-colors" />
      </div>
      <span className="text-sm font-medium text-primary/80 group-hover:text-primary transition-colors whitespace-nowrap">
        {pattern.title}
      </span>
    </motion.button>
  );
};
