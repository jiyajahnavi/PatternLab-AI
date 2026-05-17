import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { TopicRegion } from '../components/roadmap/TopicRegion';
import { FloatingPanel } from '../components/roadmap/FloatingPanel';
import { GapsDrawer } from '../components/roadmap/GapsDrawer';
import { useProgressStore } from '../store/useProgressStore';
import { useUserStore } from '../store/useUserStore';
import { roadmapData } from '../components/roadmap/data';
import { QUESTION_BANK } from '../data/questionBank';

export interface DatabaseTopic {
  id: string;
  name: string;
  slug: string;
  order_index: number;
  patterns: DatabasePattern[];
}

export interface DatabasePattern {
  id: string;
  name: string;
  slug: string;
  order_index: number;
  problems?: { id: string }[];
}

const getFallbackRoadmap = (): DatabaseTopic[] => {
  return roadmapData.map((t, tIdx) => {
    let qbKey = t.title.toLowerCase();
    if (qbKey === 'array') qbKey = 'arrays';
    if (qbKey === 'double linked list') qbKey = 'doubly-linked-list';
    if (qbKey === 'binary search tree') qbKey = 'bst';
    if (qbKey === 'dynamic programming') qbKey = 'dp';
    qbKey = qbKey.replace(/\s+/g, '-');

    const topicQuestions = QUESTION_BANK[qbKey] || [];

    return {
      id: t.id,
      name: t.title,
      slug: t.title.toLowerCase().replace(/\s+/g, '-'),
      order_index: tIdx + 1,
      patterns: t.patterns.map((p, pIdx) => {
        const matchingProblems = topicQuestions.filter(q => {
          const qPat = q.pattern.toLowerCase().replace(/[^a-z0-9]/g, '');
          const pPat = p.title.toLowerCase().replace(/[^a-z0-9]/g, '');
          return qPat === pPat || qPat.includes(pPat) || pPat.includes(qPat);
        }).map(q => ({ id: q.id }));

        return {
          id: p.id,
          name: p.title,
          slug: p.title.toLowerCase().replace(/\s+/g, '-'),
          order_index: pIdx + 1,
          problems: matchingProblems
        };
      })
    };
  });
};

export const RoadmapPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  // State for panels
  const [selectedNode, setSelectedNode] = useState<{ id: string; title: string; type: 'pattern' | 'brain' | 'gap' } | null>(null);
  const [isGapsOpen, setIsGapsOpen] = useState(false);
  const [topics, setTopics] = useState<DatabaseTopic[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { fetchUserProgress } = useProgressStore();
  const { user } = useUserStore();

  useEffect(() => {
    if (user) {
      fetchUserProgress(user.id);
    }
  }, [user, fetchUserProgress]);

  useEffect(() => {
    async function fetchRoadmap() {
      try {
        const { data, error } = await supabase
          .from('topics')
          .select(`
            id, name, slug, order_index,
            patterns (
              id, name, slug, order_index,
              problems (id)
            )
          `)
          .order('order_index', { ascending: true })
          .order('order_index', { foreignTable: 'patterns', ascending: true });

        if (error) throw error;
        
        if (data && data.length > 0) {
          setTopics(data as unknown as DatabaseTopic[]);
        } else {
          console.warn('Roadmap data is empty in database, loading beautiful local fallback.');
          setTopics(getFallbackRoadmap());
        }
      } catch (err) {
        console.warn('Failed to fetch roadmap from database (using fallback):', err);
        setTopics(getFallbackRoadmap());
      } finally {
        setLoading(false);
      }
    }
    fetchRoadmap();
  }, []);

  const handleNodeClick = (id: string, title: string, type: 'pattern' | 'brain' | 'gap') => {
    if (type === 'brain') {
      navigate('/chat');
    } else if (type === 'gap') {
      setSelectedNode({ id, title, type });
      setIsGapsOpen(true);
    } else {
      setSelectedNode({ id, title, type });
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-background">
      {/* Background elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-600/5 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="absolute inset-0 z-10 p-8 pt-24 overflow-auto scroll-smooth" ref={containerRef}>
        <div className="max-w-7xl mx-auto flex flex-col gap-32 pb-48">
          
          <div className="text-center space-y-4">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
            >
              RoadMap
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-muted max-w-2xl mx-auto"
            >
              Your progression through algorithmic mastery. Evolve your problem-solving intuition step by step.
            </motion.p>
          </div>

          <div className="flex flex-col gap-24 relative">
            {/* Draw a subtle vertical line connecting topics */}
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-accent/0 via-accent/20 to-accent/0 -translate-x-1/2 z-0" />
            
            {loading ? (
              <div className="flex justify-center items-center py-32 text-muted">
                Loading Roadmap...
              </div>
            ) : topics.map((topic, index) => (
              <TopicRegion 
                key={topic.id} 
                topic={topic} 
                index={index}
                onNodeClick={handleNodeClick}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Floating Panel for Pattern / Brain */}
      <FloatingPanel 
        isOpen={selectedNode !== null && selectedNode.type !== 'gap'} 
        node={selectedNode} 
        onClose={() => setSelectedNode(null)} 
      />

      {/* Gaps Side Drawer */}
      <GapsDrawer 
        isOpen={isGapsOpen} 
        node={selectedNode}
        onClose={() => {
          setIsGapsOpen(false);
          setSelectedNode(null);
        }} 
      />
    </div>
  );
};
