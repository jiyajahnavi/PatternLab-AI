import React from 'react';
import { Award } from 'lucide-react';
import { useProgressStore } from '../../store/useProgressStore';

export const TopicMasteryGrid: React.FC = () => {
  const { topics } = useProgressStore();

  const masteredTopics = Object.values(topics).filter(t => t.fullyCompleted);

  return (
    <div className="bg-surface border border-border rounded-xl p-6 h-full">
      <div className="flex items-center gap-2 mb-6">
        <Award className="text-yellow-500" size={20} />
        <h3 className="text-lg font-bold text-primary">Topic Mastery</h3>
      </div>
      
      {masteredTopics.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {masteredTopics.map(topic => (
            <div 
              key={topic.id}
              className="px-3 py-1.5 bg-accent/10 border border-accent/20 text-accent rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-[0_0_10px_rgba(124,111,247,0.1)]"
            >
              <span>{topic.name}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="h-32 flex flex-col items-center justify-center text-center text-muted border border-dashed border-border rounded-lg bg-background/50">
          <p className="text-sm">No topics mastered yet.</p>
          <p className="text-xs mt-1">Complete all 3 levels of a topic to earn a badge!</p>
        </div>
      )}
    </div>
  );
};
