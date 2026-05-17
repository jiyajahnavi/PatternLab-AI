import React from 'react';
import { motion } from 'framer-motion';
import type { DatabasePattern } from '../../../pages/RoadmapPage';
import { Network, CheckCircle2 } from 'lucide-react';
import { useProgressStore } from '../../../store/useProgressStore';

interface PatternNodeProps {
  pattern: DatabasePattern;
  index: number;
  onClick: () => void;
}

export const PatternNode: React.FC<PatternNodeProps> = ({ pattern, index, onClick }) => {
  const { solvedProblems } = useProgressStore();
  
  const totalProblems = pattern.problems?.length || 0;
  const solvedCount = pattern.problems?.filter(p => solvedProblems.includes(p.id)).length || 0;
  const progressPercent = totalProblems > 0 ? (solvedCount / totalProblems) * 100 : 0;
  const isFullyCompleted = totalProblems > 0 && solvedCount === totalProblems;

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, type: "spring", stiffness: 300 }}
      onClick={onClick}
      className={`group relative flex items-center gap-3 bg-surface border px-4 py-2.5 rounded-full transition-all shadow-sm ${
        isFullyCompleted 
          ? 'border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.15)] bg-green-500/5' 
          : progressPercent > 0
          ? 'border-green-500/30 bg-green-500/5 hover:border-green-500/50'
          : 'border-border hover:border-primary/50'
      }`}
    >
      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 rounded-full transition-opacity" />
      
      {/* Progress Ring Background */}
      <div className="relative w-6 h-6 rounded-full flex items-center justify-center shrink-0">
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 24 24">
          <circle 
            cx="12" cy="12" r="11" 
            className="stroke-border fill-background" 
            strokeWidth="2" 
          />
          {progressPercent > 0 && (
            <circle 
              cx="12" cy="12" r="11" 
              className="stroke-green-400 fill-transparent transition-all duration-1000 ease-out" 
              strokeWidth="2"
              strokeDasharray={`${(progressPercent / 100) * 69} 69`}
              strokeLinecap="round"
            />
          )}
        </svg>
        
        {isFullyCompleted ? (
          <CheckCircle2 size={12} className="text-green-400 relative z-10" />
        ) : (
          <Network size={10} className={`relative z-10 transition-colors ${
            progressPercent > 0 ? 'text-green-400' : 'text-muted group-hover:text-primary'
          }`} />
        )}
      </div>

      <div className="flex flex-col items-start">
        <span className={`text-sm font-medium whitespace-nowrap transition-colors ${
          isFullyCompleted ? 'text-green-400' : progressPercent > 0 ? 'text-primary' : 'text-primary/80 group-hover:text-primary'
        }`}>
          {pattern.name}
        </span>
        {totalProblems > 0 && (
          <span className={`text-[9px] font-mono tracking-wider ${
            isFullyCompleted ? 'text-green-400/80' : 'text-muted'
          }`}>
            {solvedCount}/{totalProblems} SOLVED
          </span>
        )}
      </div>
    </motion.button>
  );
};
