import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useProgressStore, type TopicProgress } from '../../store/useProgressStore';

interface TopicListProps {
  activeTopicId: string;
  onSelectTopic: (id: string) => void;
}

export const TopicList: React.FC<TopicListProps> = ({ activeTopicId, onSelectTopic }) => {
  const { topics } = useProgressStore();
  const topicsList = Object.values(topics);

  return (
    <div className="flex flex-col gap-2">
      {topicsList.map((topic) => (
        <TopicCard 
          key={topic.id} 
          topic={topic} 
          isActive={topic.id === activeTopicId} 
          onClick={() => onSelectTopic(topic.id)} 
        />
      ))}
    </div>
  );
};

const TopicCard: React.FC<{ topic: TopicProgress; isActive: boolean; onClick: () => void }> = ({ topic, isActive, onClick }) => {
  const getPct = (solved: number, total: number) => total > 0 ? (solved / total) * 100 : 0;
  
  const l1Pct = getPct(topic.level1.solved, topic.level1.total);
  const l2Pct = getPct(topic.level2.solved, topic.level2.total);
  const l3Pct = getPct(topic.level3.solved, topic.level3.total);

  return (
    <div 
      onClick={onClick}
      className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-3 ${
        isActive 
          ? 'bg-surface border-accent ring-1 ring-accent/50' 
          : 'bg-surface/50 border-border hover:bg-surface hover:border-border/80'
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-primary">{topic.name}</h3>
        {topic.fullyCompleted && (
          <CheckCircle2 size={16} className="text-accent" />
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <ProgressBar level={1} pct={l1Pct} color="bg-green-500" />
        <ProgressBar level={2} pct={l2Pct} color="bg-yellow-500" />
        <ProgressBar level={3} pct={l3Pct} color="bg-accent" />
      </div>
    </div>
  );
};

const ProgressBar: React.FC<{ level: number, pct: number, color: string }> = ({ level, pct, color }) => (
  <div className="flex items-center gap-3">
    <div className="text-[10px] text-muted font-mono w-4">L{level}</div>
    <div className="flex-1 h-1.5 bg-background rounded-full overflow-hidden">
      <div 
        className={`h-full rounded-full transition-all duration-700 ease-out ${color}`} 
        style={{ width: `${pct}%` }} 
      />
    </div>
  </div>
);
