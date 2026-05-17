import React from 'react';
import { motion } from 'framer-motion';
import { PatternNode } from './nodes/PatternNode';
import { BrainNode } from './nodes/BrainNode';
import { GapsNode } from './nodes/GapsNode';
import type { DatabaseTopic } from '../../pages/RoadmapPage';

interface TopicRegionProps {
  topic: DatabaseTopic;
  index: number;
  onNodeClick: (id: string, title: string, type: 'pattern' | 'brain' | 'gap') => void;
}

export const TopicRegion: React.FC<TopicRegionProps> = ({ topic, index, onNodeClick }) => {
  const isEven = index % 2 === 0;

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
        <div className="bg-surface/80 backdrop-blur-md border border-border p-6 rounded-2xl shadow-xl w-full max-w-sm relative group hover:border-accent/50 transition-colors duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
          <h2 className="text-sm font-mono text-accent mb-2 uppercase tracking-wider">Level {index + 1}</h2>
          <h3 className="text-2xl font-bold text-primary">{topic.name}</h3>
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
