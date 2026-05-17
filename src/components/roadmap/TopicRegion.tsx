import React from 'react';
import { motion } from 'framer-motion';
import { PatternNode } from './nodes/PatternNode';
import { BrainNode } from './nodes/BrainNode';
import { GapsNode } from './nodes/GapsNode';
import type { DatabaseTopic } from '../../pages/RoadmapPage';
import { useProgressStore } from '../../store/useProgressStore';

interface TopicRegionProps {
  topic: DatabaseTopic;
  index: number;
  onNodeClick: (id: string, title: string, type: 'pattern' | 'brain' | 'gap') => void;
}

export const TopicRegion: React.FC<TopicRegionProps> = ({ topic, index, onNodeClick }) => {
  const isEven = index % 2 === 0;
  const { solvedProblems } = useProgressStore();

  let totalProblems = 0;
  let solvedCount = 0;
  topic.patterns.forEach(pattern => {
    const pTotal = pattern.problems?.length || 0;
    const pSolved = pattern.problems?.filter(p => solvedProblems.includes(p.id)).length || 0;
    totalProblems += pTotal;
    solvedCount += pSolved;
  });

  const progressPercent = totalProblems > 0 ? (solvedCount / totalProblems) * 100 : 0;
  const isFullyCompleted = totalProblems > 0 && solvedCount === totalProblems;

  // Determine glow based on completion
  const borderOpacity = Math.max(0.2, (progressPercent / 100) * 0.6); // 0.2 to 0.6
  const glowOpacity = Math.max(0, (progressPercent / 100) * 0.15); // 0 to 0.15

  return (
    <motion.div 
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`relative flex flex-col md:flex-row gap-8 items-center ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} z-10`}
    >
      {/* Topic Title / Hub */}
      <div className={`w-full md:w-1/3 flex flex-col ${isEven ? 'items-start md:items-end text-left md:text-right' : 'items-start text-left'}`}>
        <div className="bg-surface/80 backdrop-blur-md border p-6 rounded-2xl shadow-xl w-full max-w-sm relative group transition-colors duration-500 overflow-hidden"
             style={{ 
               borderColor: progressPercent > 0 ? `rgba(74, 222, 128, ${borderOpacity})` : 'var(--border)',
               boxShadow: progressPercent > 0 ? `0 0 30px rgba(74, 222, 128, ${glowOpacity})` : undefined
             }}>
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          
          {/* Edge lighting progression */}
          {progressPercent > 0 && (
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-400/40 transition-all duration-1000 ease-out" style={{ height: `${progressPercent}%` }} />
          )}

          <div className="relative z-10">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-mono text-accent uppercase tracking-wider">Level {index + 1}</h2>
              {totalProblems > 0 && (
                <span className={`text-[10px] font-mono tracking-wider ${isFullyCompleted ? 'text-green-400 font-bold' : 'text-muted'}`}>
                  {solvedCount} / {totalProblems} SOLVED
                </span>
              )}
            </div>
            <h3 className={`text-2xl font-bold transition-colors ${isFullyCompleted ? 'text-green-400/90' : 'text-primary'}`}>{topic.name}</h3>
          </div>
        </div>
      </div>

      {/* Nodes Connection Area */}
      <div className="w-full md:w-2/3 flex flex-wrap gap-4 justify-center md:justify-start pl-8 md:pl-0">
        
        {/* Core Pattern Nodes */}
        <div className="flex flex-wrap gap-3 w-full justify-start items-center">
          {topic.patterns.map((pattern, idx) => (
            <PatternNode 
              key={pattern.id}
              pattern={pattern}
              index={idx}
              onClick={() => onNodeClick(pattern.id, pattern.name, 'pattern')}
            />
          ))}
        </div>

        {/* Special Nodes: Brain & Gaps */}
        <div className="flex gap-4 mt-4 w-full justify-start items-center">
          <BrainNode onClick={() => onNodeClick(`${topic.id}-brain`, `${topic.name} Brain`, 'brain')} />
          <GapsNode onClick={() => onNodeClick(`${topic.id}-gap`, `${topic.name} Gaps`, 'gap')} />
        </div>

      </div>
    </motion.div>
  );
};
