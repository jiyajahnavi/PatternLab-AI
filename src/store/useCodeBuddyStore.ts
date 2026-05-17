import { create } from 'zustand';
import type { Problem } from './useProblemStore';
import { mockProblem } from './useProblemStore';
import { QUESTION_BANK } from '../data/questionBank';

export interface Participant {
  id: string;
  name: string;
  avatarUrl: string;
  status: 'coding' | 'submitting' | 'submitted';
  score?: number;
  solvedTime?: number;
  attempts?: number;
  hintsUsed?: number;
  code?: string;
  correctness?: number;
  complexityScore?: number;
  speedScore?: number;
  qualityScore?: number;
  hintScore?: number;
  approach?: string;
  complexity?: string;
}

export interface CodeBuddyRoom {
  id: string;
  code: string;
  status: 'lobby' | 'active' | 'completed';
  timerDuration: number; // in seconds
  gameMode: 'standard' | 'speed' | 'sudden_death';
  problem: Problem | null;
  participants: Participant[];
  winnerId?: string;
  comparisonFeedback?: string;
}

export interface CodeBuddyStats {
  totalMatches: number;
  wins: number;
  losses: number;
  winStreak: number;
  strongestTopic: string;
  weakestTopic: string;
  averageSpeed: number; // in seconds
  optimizationRating: number; // out of 100
  points: number;
}

const STATS_KEY = 'patternlab_codebuddy_stats';

const defaultStats: CodeBuddyStats = {
  totalMatches: 12,
  wins: 8,
  losses: 4,
  winStreak: 3,
  strongestTopic: 'Sliding Window',
  weakestTopic: 'Dynamic Programming',
  averageSpeed: 185,
  optimizationRating: 86,
  points: 200,
};

const loadStats = (): CodeBuddyStats => {
  try {
    const stored = localStorage.getItem(STATS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return defaultStats;
};

const saveStats = (stats: CodeBuddyStats) => {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {}
};

interface CodeBuddyState {
  room: CodeBuddyRoom | null;
  stats: CodeBuddyStats;
  timeRemaining: number;
  companionType: 'jerry' | 'devbot' | 'coder-x';
  isHost: boolean;
  
  createRoom: (settings: { timer: number; mode: 'standard' | 'speed' | 'sudden_death'; companion: 'jerry' | 'devbot' | 'coder-x'; problemSource: 'specific' | 'random' | 'ai'; topicSlug?: string; problemId?: string }) => void;
  joinRoom: (code: string) => boolean;
  leaveRoom: () => void;
  startMatch: () => void;
  tickTimer: () => void;
  submitUserSolution: (code: string, elapsedSeconds: number, attempts: number, hintsUsed: number, allPassed: boolean) => void;
  simulateOpponentProgress: () => void;
  updateStatsOnWin: (won: boolean, userSpeed: number, userScore: number, topic: string) => void;
}

export const useCodeBuddyStore = create<CodeBuddyState>((set, get) => ({
  room: null,
  stats: loadStats(),
  timeRemaining: 0,
  companionType: 'jerry',
  isHost: true,

  createRoom: (settings) => {
    // 1. Select the problem
    let selectedProblem: Problem = mockProblem;
    const topicKey = settings.topicSlug || 'arrays';

    if (settings.problemSource === 'random') {
      const bankQuestions = QUESTION_BANK[topicKey] || QUESTION_BANK['arrays'] || [];
      if (bankQuestions.length > 0) {
        const randomQ = bankQuestions[Math.floor(Math.random() * bankQuestions.length)];
        selectedProblem = {
          id: randomQ.id,
          title: randomQ.title,
          description: randomQ.description || "Solve this algorithmic challenge to verify your mastery of this pattern. Optimize for both time and space complexity constraints.",
          level: randomQ.level || 2,
          pattern: randomQ.pattern || "General",
          topic: settings.topicSlug || "arrays",
          examples: randomQ.examples || [
            { input: "nums = [2,7,11,15], target = 9", output: "[0,1]" }
          ],
          constraints: randomQ.constraints || ["1 <= nums.length <= 10^5"],
          hints: randomQ.hints || ["Think about using secondary pointer indices."],
          testCases: randomQ.testCases || [
            { id: "t1", input: "[2,7,11,15]\n9", expectedOutput: "[0,1]" }
          ]
        };
      }
    } else if (settings.problemSource === 'ai') {
      // Dynamic AI Generated Problem
      selectedProblem = {
        id: `ai-${Date.now()}`,
        title: "Adaptive Subarray Equilibrium",
        description: "Given an array of integers `nums`, find the maximum length of a contiguous subarray where the sum of its elements equals the sum of elements outside it.\n\nReturn `-1` if no such subarray exists.",
        level: 3,
        pattern: "Prefix Sum / Sliding Window",
        topic: "arrays",
        examples: [
          { input: "nums = [1, 2, 3, 3]", output: "3", explanation: "The subarray [1, 2, 3] has sum 6. Elements outside are [3] sum 3. Wait, balanced balance sum constraint is met." }
        ],
        constraints: [
          "1 <= nums.length <= 10^5",
          "-10^4 <= nums[i] <= 10^4"
        ],
        hints: [
          "Precompute Prefix and Suffix Sums to query arbitrary subarray balance states in O(1).",
          "Use a hashmap tracking sum offsets to optimize window size bounds."
        ],
        testCases: [
          { id: "ai-1", input: "[1, 2, 3, 3]", expectedOutput: "3" },
          { id: "ai-2", input: "[1, 1, 1, 1]", expectedOutput: "2" }
        ]
      };
    } else if (settings.problemId) {
      // Specific Question
      const allQ = Object.values(QUESTION_BANK).flat();
      const foundQ = allQ.find(q => q.id === settings.problemId);
      if (foundQ) {
        selectedProblem = {
          id: foundQ.id,
          title: foundQ.title,
          description: foundQ.description || "Solve this algorithmic challenge to verify your mastery.",
          level: foundQ.level || 2,
          pattern: foundQ.pattern || "General",
          topic: foundQ.topic || "arrays",
          examples: foundQ.examples || [],
          constraints: foundQ.constraints || [],
          hints: foundQ.hints || [],
          testCases: foundQ.testCases || []
        };
      }
    }

    // 2. Set companion details
    let botName = "Jerry";
    let botAvatar = "https://api.dicebear.com/7.x/bottts/svg?seed=jerry";
    if (settings.companion === 'devbot') {
      botName = "Dev-Bot AI";
      botAvatar = "https://api.dicebear.com/7.x/bottts/svg?seed=devbot";
    } else if (settings.companion === 'coder-x') {
      botName = "Coder-X";
      botAvatar = "https://api.dicebear.com/7.x/bottts/svg?seed=coderx";
    }

    const roomCode = `CB-${Math.floor(1000 + Math.random() * 9000)}`;

    const newRoom: CodeBuddyRoom = {
      id: `room-${Date.now()}`,
      code: roomCode,
      status: 'lobby',
      timerDuration: settings.timer * 60,
      gameMode: settings.mode,
      problem: selectedProblem,
      participants: [
        {
          id: 'user',
          name: 'PatternLab Student',
          avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=student',
          status: 'coding'
        },
        {
          id: 'companion',
          name: botName,
          avatarUrl: botAvatar,
          status: 'coding'
        }
      ]
    };

    set({
      room: newRoom,
      timeRemaining: settings.timer * 60,
      companionType: settings.companion,
      isHost: true
    });
  },

  joinRoom: (code) => {
    if (!code || code.trim() === '') return false;
    
    // Simulate joining an online room code
    const mockCode = code.toUpperCase();
    
    let selectedProblem: Problem = mockProblem;
    const allQ = Object.values(QUESTION_BANK).flat();
    if (allQ.length > 0) {
      const q = allQ[Math.floor(Math.random() * allQ.length)];
      selectedProblem = {
        id: q.id,
        title: q.title,
        description: q.description || "Challenge Description",
        level: q.level || 2,
        pattern: q.pattern || "General",
        topic: q.topic || "arrays",
        examples: q.examples || [],
        constraints: q.constraints || [],
        hints: q.hints || [],
        testCases: q.testCases || []
      };
    }

    const joinedRoom: CodeBuddyRoom = {
      id: `room-joined-${Date.now()}`,
      code: mockCode,
      status: 'lobby',
      timerDuration: 1800, // 30 mins
      gameMode: 'standard',
      problem: selectedProblem,
      participants: [
        {
          id: 'user',
          name: 'PatternLab Student',
          avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=student',
          status: 'coding'
        },
        {
          id: 'companion',
          name: 'Jerry',
          avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=jerry',
          status: 'coding'
        }
      ]
    };

    set({
      room: joinedRoom,
      timeRemaining: 1800,
      companionType: 'jerry',
      isHost: false
    });

    return true;
  },

  leaveRoom: () => {
    set({ room: null, timeRemaining: 0 });
  },

  startMatch: () => {
    const { room } = get();
    if (!room) return;

    set({
      room: { ...room, status: 'active' }
    });
  },

  tickTimer: () => {
    const { timeRemaining, room } = get();
    if (!room || room.status !== 'active') return;

    if (timeRemaining <= 1) {
      // Sudden timer end, trigger force submit
      set({ timeRemaining: 0 });
      get().submitUserSolution("// Incomplete / Timeout solution\n", room.timerDuration, 1, 0, false);
    } else {
      set({ timeRemaining: timeRemaining - 1 });
    }
  },

  submitUserSolution: (code, elapsedSeconds, attempts, hintsUsed, allPassed) => {
    const { room, companionType } = get();
    if (!room) return;

    // 1. Calculate user scores
    const correctness = allPassed ? 100 : Math.max(0, 100 - (attempts - 1) * 30);
    const speedScore = Math.max(20, Math.round(((room.timerDuration - elapsedSeconds) / room.timerDuration) * 100));
    const complexityScore = allPassed ? 92 : 30;
    const qualityScore = allPassed ? 88 : 45;
    const hintScore = Math.max(10, 100 - hintsUsed * 30);

    const userWeighted = Math.round(
      correctness * 0.4 +
      complexityScore * 0.25 +
      speedScore * 0.15 +
      qualityScore * 0.10 +
      hintScore * 0.10
    );

    // 2. Setup Bot Performance depending on companionType
    let botCorrectness = 100;
    let botComplexity = 80;
    let botQuality = 85;
    let botSpeed = 75;
    let botHints = 1;
    let botTime = Math.round(room.timerDuration * 0.45); // Solves in 45% of time
    let botApproach = "Used a HashMap to achieve linear time complexity.";
    let botComplexityLabel = "O(N) Time · O(N) Space";
    let botCode = `def twoSum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        diff = target - num\n        if diff in seen:\n            return [seen[diff], i]\n        seen[num] = i\n    return []`;

    if (companionType === 'devbot') {
      botCorrectness = 100;
      botComplexity = 95;
      botQuality = 92;
      botSpeed = 90;
      botHints = 0;
      botTime = Math.round(room.timerDuration * 0.28); // Blazing fast
      botApproach = "Fully optimized two-pointer single pass solution.";
      botComplexityLabel = "O(N) Time · O(1) Space";
      botCode = `def twoSumOptimal(nums, target):\n    # Dual-Pointer sorted search\n    sorted_nums = sorted(enumerate(nums), key=lambda x: x[1])\n    l, r = 0, len(nums) - 1\n    while l < r:\n        s = sorted_nums[l][1] + sorted_nums[r][1]\n        if s == target:\n            return [sorted_nums[l][0], sorted_nums[r][0]]\n        elif s < target:\n            l += 1\n        else:\n            r -= 1\n    return []`;
    } else if (companionType === 'coder-x') {
      botCorrectness = 70;
      botComplexity = 50;
      botQuality = 65;
      botSpeed = 40;
      botHints = 3;
      botTime = Math.round(room.timerDuration * 0.85); // Very slow
      botApproach = "Nested brute-force loop. Lacks computational optimization.";
      botComplexityLabel = "O(N²) Time · O(1) Space";
      botCode = `def twoSumBruteForce(nums, target):\n    for i in range(len(nums)):\n        for j in range(i + 1, len(nums)):\n            if nums[i] + nums[j] == target:\n                return [i, j]\n    return []`;
    }

    const botHintScore = Math.max(10, 100 - botHints * 30);
    const botWeighted = Math.round(
      botCorrectness * 0.4 +
      botComplexity * 0.25 +
      botSpeed * 0.15 +
      botQuality * 0.10 +
      botHintScore * 0.10
    );

    // 3. Update Participant list
    const updatedParticipants = room.participants.map(p => {
      if (p.id === 'user') {
        return {
          ...p,
          status: 'submitted' as const,
          score: userWeighted,
          solvedTime: elapsedSeconds,
          attempts,
          hintsUsed,
          code,
          correctness,
          complexityScore,
          speedScore,
          qualityScore,
          hintScore,
          approach: allPassed ? "Completed with dual index search map" : "Incomplete logic",
          complexity: allPassed ? "O(N) Time · O(N) Space" : "N/A"
        };
      } else {
        // Companion is submitted too
        return {
          ...p,
          status: 'submitted' as const,
          score: botWeighted,
          solvedTime: botTime,
          attempts: botCorrectness === 100 ? 1 : 3,
          hintsUsed: botHints,
          code: botCode,
          correctness: botCorrectness,
          complexityScore: botComplexity,
          speedScore: botSpeed,
          qualityScore: botQuality,
          hintScore: botHintScore,
          approach: botApproach,
          complexity: botComplexityLabel
        };
      }
    });

    const userWon = userWeighted >= botWeighted;
    const winnerId = userWon ? 'user' : 'companion';

    const feedback = `Battle Review:\n- PatternLab Student achieved a total score of ${userWeighted} (Correctness: ${correctness}%, Complexity: ${complexityScore}/100, Speed: ${speedScore}/100).\n- ${room.participants[1].name} finished with a score of ${botWeighted} (Correctness: ${botCorrectness}%, Speed: ${botSpeed}/100).\n\nArchitectural Analysis:\n- Your approach uses hashing which provides excellent linear time execution. ${room.participants[1].name} utilized the optimal strategy: ${botApproach}.\n- You demonstrated high structural cleanliness. Keep optimizing complexity tradeoffs!`;

    const completedRoom: CodeBuddyRoom = {
      ...room,
      status: 'completed',
      participants: updatedParticipants,
      winnerId,
      comparisonFeedback: feedback
    };

    set({ room: completedRoom });

    // Update persistent stats
    get().updateStatsOnWin(userWon, elapsedSeconds, userWeighted, room.problem?.pattern || 'General');
  },

  simulateOpponentProgress: () => {
    // Toggle companion status
    const { room } = get();
    if (!room || room.status !== 'active') return;

    const updated = room.participants.map(p => {
      if (p.id === 'companion') {
        return { ...p, status: 'submitting' as const };
      }
      return p;
    });

    set({ room: { ...room, participants: updated } });
  },

  updateStatsOnWin: (won, userSpeed, userScore, topic) => {
    const currentStats = { ...get().stats };
    
    currentStats.totalMatches += 1;
    if (won) {
      currentStats.wins += 1;
      currentStats.winStreak += 1;
      currentStats.points += 25; // Battle victory points
    } else {
      currentStats.losses += 1;
      currentStats.winStreak = 0;
    }

    // Recalculate average speed
    currentStats.averageSpeed = Math.round(
      (currentStats.averageSpeed * (currentStats.totalMatches - 1) + userSpeed) / currentStats.totalMatches
    );

    // Update optimization rating
    currentStats.optimizationRating = Math.round(
      (currentStats.optimizationRating * (currentStats.totalMatches - 1) + userScore) / currentStats.totalMatches
    );

    if (won && topic && topic !== 'General') {
      currentStats.strongestTopic = topic;
    }

    set({ stats: currentStats });
    saveStats(currentStats);
  }
}));
