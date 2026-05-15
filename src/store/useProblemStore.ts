import { create } from 'zustand';

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  passed?: boolean;
  error?: string;
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  level: number;
  pattern: string;
  topic: string;
  examples: { input: string; output: string; explanation?: string }[];
  constraints: string[];
  hints: string[];
  testCases: TestCase[];
}

interface AIReview {
  verdict: 'correct' | 'wrong' | 'tle' | 'error';
  timeComplexity?: string;
  spaceComplexity?: string;
  optimizationPotential?: string;
  targetComplexity?: string;
  lineAnnotations?: { line: number; severity: string; message: string; type: string }[];
  approachSummary?: string;
  betterApproach?: string;
  optimizedHint?: string;
  hints?: string[];
  optimizedCodeSkeleton?: string;
}

interface ProblemState {
  problem: Problem | null;
  code: string;
  language: string;
  isRunning: boolean;
  isSubmitting: boolean;
  activeTestCaseId: string | null;
  testCases: TestCase[];
  aiReview: AIReview | null;
  notes: string;
  revealedHints: number;

  setProblem: (problem: Problem) => void;
  setCode: (code: string) => void;
  setLanguage: (language: string) => void;
  setRunning: (isRunning: boolean) => void;
  setSubmitting: (isSubmitting: boolean) => void;
  setActiveTestCaseId: (id: string) => void;
  updateTestCase: (id: string, updates: Partial<TestCase>) => void;
  setAIReview: (review: AIReview | null) => void;
  setNotes: (notes: string) => void;
  revealHint: () => void;
}

export const useProblemStore = create<ProblemState>((set) => ({
  problem: null,
  code: '// Write your solution here\n',
  language: 'python',
  isRunning: false,
  isSubmitting: false,
  activeTestCaseId: null,
  testCases: [],
  aiReview: null,
  notes: '',
  revealedHints: 0,

  setProblem: (problem) => set({ 
    problem, 
    testCases: problem.testCases.map(tc => ({...tc})),
    activeTestCaseId: problem.testCases[0]?.id || null,
    revealedHints: 0,
    aiReview: null
  }),
  setCode: (code) => set({ code }),
  setLanguage: (language) => set({ language }),
  setRunning: (isRunning) => set({ isRunning }),
  setSubmitting: (isSubmitting) => set({ isSubmitting }),
  setActiveTestCaseId: (id) => set({ activeTestCaseId: id }),
  updateTestCase: (id, updates) => set((state) => ({
    testCases: state.testCases.map(tc => tc.id === id ? { ...tc, ...updates } : tc)
  })),
  setAIReview: (review) => set({ aiReview: review }),
  setNotes: (notes) => set({ notes }),
  revealHint: () => set((state) => ({ 
    revealedHints: Math.min(state.revealedHints + 1, state.problem?.hints.length || 0) 
  })),
}));

// Mock Data for Demo
export const mockProblem: Problem = {
  id: "two-sum",
  title: "Two Sum",
  description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have **exactly one solution**, and you may not use the same element twice.\n\nYou can return the answer in any order.",
  level: 1,
  pattern: "hashmap",
  topic: "arrays",
  examples: [
    {
      input: "nums = [2,7,11,15], target = 9",
      output: "[0,1]",
      explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]."
    },
    {
      input: "nums = [3,2,4], target = 6",
      output: "[1,2]"
    }
  ],
  constraints: [
    "2 <= nums.length <= 10^4",
    "-10^9 <= nums[i] <= 10^9",
    "-10^9 <= target <= 10^9",
    "Only one valid answer exists."
  ],
  hints: [
    "A really brute force way would be to search for all possible pairs of numbers but that would be too slow. Again, it's best to try out brute force solutions for just for completeness. It is from these brute force solutions that you can come up with optimizations.",
    "So, if we fix one of the numbers, say `x`, we have to scan the entire array to find the next number `y` which is `target - x` where value `target` is the input parameter. Can we change our array keeping so that this search becomes faster?",
    "The second train of thought is, without changing the array, can we use additional space somehow? Like maybe a hash map to speed up the search?"
  ],
  testCases: [
    { id: "tc1", input: "[2,7,11,15]\n9", expectedOutput: "[0,1]" },
    { id: "tc2", input: "[3,2,4]\n6", expectedOutput: "[1,2]" },
    { id: "tc3", input: "[3,3]\n6", expectedOutput: "[0,1]" }
  ]
};
