import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useBrainStore } from './useBrainStore';

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
          insights: [newItem, ...state.insights].slice(0, 15)
        }));
      },
      clearMemory: () => set({ insights: [] }),
      getMemoryContext: () => {
        const { insights } = get();

        // Dynamically pull Brain context if available
        let brainContext = '';
        try {
          const brain = useBrainStore.getState();
          if (brain.sessions.length > 0) {
            const tier = brain.rating.tier;
            const overall = brain.rating.overall;
            const personality = brain.personalitySummary;
            const weakTraits = brain.behavioralTraits.filter((t: any) => t.type === 'weakness').map((t: any) => t.trait).join(', ');
            const strongTraits = brain.behavioralTraits.filter((t: any) => t.type === 'strength').map((t: any) => t.trait).join(', ');
            brainContext = [
              `\n[BRAIN INTELLIGENCE PROFILE]`,
              `- Brain Rating: ${overall} (${tier})`,
              personality ? `- Personality: ${personality}` : '',
              strongTraits ? `- Brain-identified strengths: ${strongTraits}` : '',
              weakTraits ? `- Brain-identified weaknesses: ${weakTraits}` : '',
              `- Total Brain sessions: ${brain.sessions.length}`,
            ].filter(Boolean).join('\n');
          }
        } catch {}

        const insightLines = insights.length > 0
          ? insights.map(i => `- [${i.topic}]: ${i.insight}`).join('\n')
          : 'No prior memory of user preferences.';

        return insightLines + brainContext;
      }
    }),
    { name: 'patternlab-memory' }
  )
);
