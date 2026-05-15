import React, { useState, useEffect } from 'react';
import { SummaryCards } from '../components/progress/SummaryCards';
import { TopicList } from '../components/progress/TopicList';
import { TopicDetail } from '../components/progress/TopicDetail';
import { useProgressStore } from '../store/useProgressStore';
import { Loader2 } from 'lucide-react';

export const ProgressPage: React.FC = () => {
  const [activeTopicId, setActiveTopicId] = useState<string>('arrays');
  const { topics, mockPopulate, syncTopics } = useProgressStore();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // 1. Ensure all initial topics exist and have correct totals
    syncTopics();
    
    // 2. If topics is empty, populate with mock data
    if (Object.keys(topics).length === 0) {
      mockPopulate();
    } 
    setIsLoaded(true);
  }, [topics, mockPopulate, syncTopics]);

  if (!isLoaded) {
    return (
      <div className="h-full flex items-center justify-center bg-background text-primary">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-background text-primary p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Progress Hub</h1>
          <p className="text-muted text-sm">Track your journey through the Data Structures & Algorithms curriculum.</p>
        </div>

        <SummaryCards />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 flex flex-col gap-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted px-2">Curriculum</h3>
            <TopicList activeTopicId={activeTopicId} onSelectTopic={setActiveTopicId} />
          </div>
          
          <div className="lg:col-span-8">
            <TopicDetail topicId={activeTopicId} />
          </div>
        </div>
      </div>
    </div>
  );
};
