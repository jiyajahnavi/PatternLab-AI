import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MemoryItem {
  id: string;
  topic: string;
  insight: string;
  timestamp: string;
}

interface MemoryState {
  insights: MemoryItem[];
  addInsight: (topic: string, insight: string) => void;
  clearMemory: () => void;
  getMemoryContext: () => string;
}

export const useMemoryStore = create<MemoryState>()(
  persist(
    (set, get) => ({
      insights: [],
      addInsight: (topic, insight) => {
        const newItem: MemoryItem = {
          id: Math.random().toString(36).substring(7),
          topic,
          insight,
          timestamp: new Date().toISOString()
        };
        set((state) => ({
          insights: [newItem, ...state.insights].slice(0, 15) // Keep last 15 insights
        }));
      },
      clearMemory: () => set({ insights: [] }),
      getMemoryContext: () => {
        const { insights } = get();
        if (insights.length === 0) return "No prior memory of user preferences.";
        return insights
          .map(i => `- [${i.topic}]: ${i.insight}`)
          .join('\n');
      }
    }),
    { name: 'patternlab-memory' }
  )
);
