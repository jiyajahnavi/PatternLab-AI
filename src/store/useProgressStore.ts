import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format, subDays } from 'date-fns';
import { supabase } from '../services/supabaseClient';

export interface LevelStats {
  total: number;
  solved: number;
}

export interface TopicProgress {
  id: string;
  name: string;
  patterns: string[];
  level1: LevelStats;
  level2: LevelStats;
  level3: LevelStats;
  lastAttempted?: string;
  fullyCompleted: boolean;
  patternStats: Record<string, number>; // pattern name -> solved count
}

interface ProgressState {
  points: number;
  currentStreak: number;
  maxStreak: number;
  lastActiveDate: string | null;
  heatmap: Record<string, number>;
  topics: Record<string, TopicProgress>;
  solvedProblems: string[]; // Store solved problem IDs
  
  syncTopics: () => void;
  addPoints: (amount: number) => void;
  recordActivity: () => void;
  recordProblemSolved: (topicId: string, level: 1 | 2 | 3, problemId?: string, pattern?: string) => void;
  mockPopulate: () => void;
  fetchUserProgress: (userId: string) => Promise<void>;
  toggleProblemCompletion: (userId: string, problemId: string, completed: boolean) => Promise<void>;
}

export const normalizeTopicId = (id: string): string => {
  const normalized = id.toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/dynamic-programming/g, 'dp')
    .replace(/hash-map|hash-table/g, 'hashmap')
    .replace(/binary-search-tree/g, 'bst')
    .replace(/bit-manipulation/g, 'bit-manipulation');
    
  return normalized;
};

export const INITIAL_TOPICS: TopicProgress[] = [
  { id: 'arrays', name: 'Arrays', patterns: ['Two Pointer', 'Sliding Window', 'Prefix Sum', 'Kadane’s Algorithm'], level1: {total: 4, solved: 0}, level2: {total: 4, solved: 0}, level3: {total: 4, solved: 0}, fullyCompleted: false, patternStats: {} },
  { id: 'strings', name: 'Strings', patterns: ['Two Pointer (Palindrome)', 'Sliding Window (String)', 'Expand Around Center'], level1: {total: 2, solved: 0}, level2: {total: 2, solved: 0}, level3: {total: 1, solved: 0}, fullyCompleted: false, patternStats: {} },
  { id: 'binary-search', name: 'Binary Search', patterns: ['Classic Binary Search', 'Lower / Upper Bound', 'Binary Search on Answers', 'Search in 2D Matrix'], level1: {total: 1, solved: 0}, level2: {total: 2, solved: 0}, level3: {total: 1, solved: 0}, fullyCompleted: false, patternStats: {} },
  { id: 'stack', name: 'Stack', patterns: ['Monotonic Stack', 'Expression Evaluation', 'Stack Simulation', 'Parenthesis & Scoring', 'Stack-Based Design', 'Stack + Greedy', 'Recursive Stack'], level1: {total: 1, solved: 0}, level2: {total: 2, solved: 0}, level3: {total: 1, solved: 0}, fullyCompleted: false, patternStats: {} },
  { id: 'queue', name: 'Queue', patterns: ['BFS', 'Task Scheduling', 'Circular Queue', 'Sliding Window'], level1: {total: 1, solved: 0}, level2: {total: 1, solved: 0}, level3: {total: 0, solved: 0}, fullyCompleted: false, patternStats: {} },
  { id: 'recursion', name: 'Recursion', patterns: ['Linear Recursion', 'Non-Linear Recursion', 'Divide & Conquer', 'Recursion on Linked List / Stack', 'Subsequences'], level1: {total: 1, solved: 0}, level2: {total: 2, solved: 0}, level3: {total: 1, solved: 0}, fullyCompleted: false, patternStats: {} },
  { id: 'linked-list', name: 'Linked List', patterns: ['Basic Operations', 'Fast and Slow Pointers', 'Reversal Pattern', 'Merge / Sort', 'Linked List + Stack'], level1: {total: 2, solved: 0}, level2: {total: 1, solved: 0}, level3: {total: 1, solved: 0}, fullyCompleted: false, patternStats: {} },
  { id: 'doubly-linked-list', name: 'Doubly Linked List', patterns: ['Basic DLL Operations', 'Merge / Sort / Reorder'], level1: {total: 1, solved: 0}, level2: {total: 1, solved: 0}, level3: {total: 0, solved: 0}, fullyCompleted: false, patternStats: {} },
  { id: 'hashmap', name: 'HashMap', patterns: ['Frequency Map / Counting', 'Prefix Sum with Map', 'Sliding Window + HashMap'], level1: {total: 1, solved: 0}, level2: {total: 1, solved: 0}, level3: {total: 1, solved: 0}, fullyCompleted: false, patternStats: {} },
  { id: 'heap', name: 'Heap', patterns: ['Top-K Elements', 'Merge K Sorted', 'Heap with Sliding Window', 'Heap Implementation', 'Huffman Pattern'], level1: {total: 1, solved: 0}, level2: {total: 1, solved: 0}, level3: {total: 1, solved: 0}, fullyCompleted: false, patternStats: {} },
  { id: 'tree', name: 'Tree', patterns: ['DFS Traversals', 'BFS / Level Order', 'Lowest Common Ancestor', 'Serialization / Construction'], level1: {total: 1, solved: 0}, level2: {total: 2, solved: 0}, level3: {total: 1, solved: 0}, fullyCompleted: false, patternStats: {} },
  { id: 'bst', name: 'Binary Search Tree', patterns: ['BST Operations', 'LCA & Range Queries'], level1: {total: 1, solved: 0}, level2: {total: 2, solved: 0}, level3: {total: 0, solved: 0}, fullyCompleted: false, patternStats: {} },
  { id: 'graph', name: 'Graph', patterns: ['BFS (Unweighted Path)', 'DFS (Connectivity)', 'Topological Sort', 'MST / Union-Find', 'Dijkstra (Weighted)', 'Bellman-Ford', 'Floyd-Warshall'], level1: {total: 0, solved: 0}, level2: {total: 3, solved: 0}, level3: {total: 1, solved: 0}, fullyCompleted: false, patternStats: {} },
  { id: 'backtracking', name: 'Backtracking', patterns: ['Choice-Based Backtracking', 'Constraint-Based Backtracking', 'Grid / Path Backtracking', 'Decision Tree / Sequence Generation'], level1: {total: 0, solved: 0}, level2: {total: 1, solved: 0}, level3: {total: 1, solved: 0}, fullyCompleted: false, patternStats: {} },
  { id: 'greedy', name: 'Greedy', patterns: ['Intervals & Reach', 'Sorting / Local Choice'], level1: {total: 0, solved: 0}, level2: {total: 2, solved: 0}, level3: {total: 0, solved: 0}, fullyCompleted: false, patternStats: {} },
  { id: 'dp', name: 'Dynamic Programming', patterns: ['1D DP', '2D DP (Matrix)', 'Knapsack Pattern', 'Longest Common Subsequence', 'Interval DP'], level1: {total: 0, solved: 0}, level2: {total: 3, solved: 0}, level3: {total: 2, solved: 0}, fullyCompleted: false, patternStats: {} },
  { id: 'trie', name: 'Trie', patterns: ['Basic Trie Operations', 'Word Break / Segmentation', 'Bitwise Trie / XOR'], level1: {total: 0, solved: 0}, level2: {total: 1, solved: 0}, level3: {total: 1, solved: 0}, fullyCompleted: false, patternStats: {} },
  { id: 'bit-manipulation', name: 'Bit Manipulation', patterns: ['Basic Bit Operations', 'Subsets / Bitmask', 'Advanced XOR'], level1: {total: 2, solved: 0}, level2: {total: 1, solved: 0}, level3: {total: 0, solved: 0}, fullyCompleted: false, patternStats: {} },
];

const initialTopicsRecord = INITIAL_TOPICS.reduce((acc, topic) => {
  acc[topic.id] = topic;
  return acc;
}, {} as Record<string, TopicProgress>);

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      points: 0,
      currentStreak: 0,
      maxStreak: 0,
      lastActiveDate: null,
      heatmap: {},
      topics: initialTopicsRecord,
      solvedProblems: [],

      syncTopics: () => {
        set((state) => {
          const updatedTopics = { ...state.topics };
          let changed = false;
          INITIAL_TOPICS.forEach(topic => {
            if (!updatedTopics[topic.id]) {
              updatedTopics[topic.id] = { ...topic };
              changed = true;
            } else {
              // Ensure totals match the current curriculum
              if (updatedTopics[topic.id].level1.total !== topic.level1.total ||
                  updatedTopics[topic.id].level2.total !== topic.level2.total ||
                  updatedTopics[topic.id].level3.total !== topic.level3.total) {
                updatedTopics[topic.id] = {
                  ...updatedTopics[topic.id],
                  level1: { ...updatedTopics[topic.id].level1, total: topic.level1.total },
                  level2: { ...updatedTopics[topic.id].level2, total: topic.level2.total },
                  level3: { ...updatedTopics[topic.id].level3, total: topic.level3.total },
                };
                changed = true;
              }
            }
          });
          return changed ? { topics: updatedTopics } : state;
        });
      },

      addPoints: (amount) => set((state) => ({ points: state.points + amount })),

      recordActivity: () => {
        const today = format(new Date(), 'yyyy-MM-dd');
        set((state) => {
          if (state.lastActiveDate === today) return state; // Already active today

          let newStreak = state.currentStreak;
          if (state.lastActiveDate === format(subDays(new Date(), 1), 'yyyy-MM-dd')) {
            newStreak += 1;
          } else {
            newStreak = 1;
          }

          return {
            lastActiveDate: today,
            currentStreak: newStreak,
            maxStreak: Math.max(state.maxStreak, newStreak),
            points: state.points + 5 // +5 for daily login
          };
        });
      },

      recordProblemSolved: (topicId, level, problemId, pattern) => {
        const today = format(new Date(), 'yyyy-MM-dd');
        const normalizedId = normalizeTopicId(topicId);
        
        set((state) => {
          // Prevent double counting the same problem for stats
          if (problemId && state.solvedProblems.includes(problemId)) {
            return state;
          }

          const pointsEarned = level === 1 ? 10 : level === 2 ? 20 : 30;
          let topic = state.topics[normalizedId];
          
          // Fallback: If topic not in current state, try to find in INITIAL_TOPICS
          if (!topic) {
            const initialTopic = INITIAL_TOPICS.find(t => t.id === normalizedId);
            if (initialTopic) {
              topic = { ...initialTopic };
            } else {
              topic = { 
                id: normalizedId, 
                name: normalizedId.charAt(0).toUpperCase() + normalizedId.slice(1), 
                patterns: [], 
                level1: {total: 0, solved: 0}, 
                level2: {total: 0, solved: 0}, 
                level3: {total: 0, solved: 0}, 
                fullyCompleted: false,
                patternStats: {}
              };
            }
          }

          const levelKey = `level${level}` as 'level1' | 'level2' | 'level3';
          const updatedLevelStats = {
            ...topic[levelKey],
            solved: Math.min(topic[levelKey].solved + 1, Math.max(topic[levelKey].total, topic[levelKey].solved + 1))
          };

          // Update pattern stats
          const patternName = pattern || 'Unknown';
          const updatedPatternStats = {
            ...(topic.patternStats || {}),
            [patternName]: (topic.patternStats?.[patternName] || 0) + 1
          };

          // Update total if it was 0 (for AI suggested problems not in bank)
          if (updatedLevelStats.total === 0) updatedLevelStats.total = 1;

          const isFullyCompleted = 
            (levelKey === 'level1' ? updatedLevelStats.solved : topic.level1.solved) >= topic.level1.total &&
            (levelKey === 'level2' ? updatedLevelStats.solved : topic.level2.solved) >= topic.level2.total &&
            (levelKey === 'level3' ? updatedLevelStats.solved : topic.level3.solved) >= topic.level3.total &&
            topic.level1.total + topic.level2.total + topic.level3.total > 0;

          const updatedTopics = {
            ...state.topics,
            [normalizedId]: {
              ...topic,
              [levelKey]: updatedLevelStats,
              patternStats: updatedPatternStats,
              lastAttempted: new Date().toISOString(),
              fullyCompleted: isFullyCompleted
            }
          };

          return {
            points: state.points + pointsEarned,
            heatmap: {
              ...state.heatmap,
              [today]: (state.heatmap[today] || 0) + 1
            },
            topics: updatedTopics,
            solvedProblems: problemId ? [...state.solvedProblems, problemId] : state.solvedProblems
          };
        });
        
        get().recordActivity();
      },

      fetchUserProgress: async (userId: string) => {
        try {
          const { data, error } = await supabase
            .from('user_problem_progress')
            .select('problem_id')
            .eq('user_id', userId)
            .eq('completed', true);
            
          if (error) throw error;
          
          const problemIds = data.map(d => d.problem_id);
          set({ solvedProblems: problemIds });
        } catch (err) {
          console.error('Error fetching progress:', err);
        }
      },

      toggleProblemCompletion: async (userId: string, problemId: string, completed: boolean) => {
        try {
          // Optimistic update
          set((state) => {
            const newSolved = completed 
              ? [...new Set([...state.solvedProblems, problemId])]
              : state.solvedProblems.filter(id => id !== problemId);
            return { solvedProblems: newSolved };
          });

          const { error } = await supabase
            .from('user_problem_progress')
            .upsert({
              user_id: userId,
              problem_id: problemId,
              completed: completed,
              completed_at: completed ? new Date().toISOString() : null
            }, { onConflict: 'user_id, problem_id' });

          if (error) {
            // Revert on error
            set((state) => {
              const newSolved = !completed 
                ? [...new Set([...state.solvedProblems, problemId])]
                : state.solvedProblems.filter(id => id !== problemId);
              return { solvedProblems: newSolved };
            });
            throw error;
          }
        } catch (err) {
          console.error('Error toggling problem completion:', err);
        }
      },

      mockPopulate: () => {
        // Populates the store with some mock data for demo purposes
        const heatmap: Record<string, number> = {};
        for (let i = 0; i < 30; i++) {
          const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
          if (Math.random() > 0.3) {
            heatmap[date] = Math.floor(Math.random() * 5) + 1;
          }
        }

        set((state) => ({
          points: 1250,
          currentStreak: 12,
          maxStreak: 14,
          lastActiveDate: format(new Date(), 'yyyy-MM-dd'),
          heatmap,
          solvedProblems: [
            'find-max', 'reverse-array', 'two-sum', 'contains-duplicate', // Arrays
            'classic-binary-search', 'search-rotated', 'find-minimum-rotated', 'median-two-arrays-bs', // BS
            'valid-palindrome', 'valid-anagram' // Strings
          ],
          topics: {
            ...state.topics,
            'arrays': { ...state.topics['arrays'], fullyCompleted: true, level1: { total: 4, solved: 4 }, level2: { total: 4, solved: 4 }, level3: { total: 4, solved: 4 } },
            'strings': { ...state.topics['strings'], fullyCompleted: false, level1: { total: 2, solved: 2 }, level2: { total: 2, solved: 1 }, level3: { total: 2, solved: 0 } },
            'binary-search': { ...state.topics['binary-search'], fullyCompleted: true, level1: { total: 4, solved: 4 }, level2: { total: 4, solved: 4 }, level3: { total: 4, solved: 4 } },
          }
        }));
      }
    }),
    {
      name: 'progress-storage',
    }
  )
);
