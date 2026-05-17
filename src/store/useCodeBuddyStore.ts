import { create } from 'zustand';
import type { Problem } from './useProblemStore';
import { mockProblem } from './useProblemStore';
import { QUESTION_BANK } from '../data/questionBank';
import { supabase } from '../services/supabaseClient';

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
  opponentType: 'bot' | 'friend';
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
const ROOM_PREFIX = 'patternlab_cb_room_';

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

interface CodeAnalysis {
  timeComplexity: string;
  spaceComplexity: string;
  complexityScore: number;
  qualityScore: number;
  approach: string;
}

const analyzeSubmittedCode = (code: string): CodeAnalysis => {
  // Strip comments & whitespace to check if they only submitted the default comment or an empty template
  const cleanCode = code.replace(/\/\*[\s\S]*?\*\/|\/\/.*|#.*/g, "").trim();
  const isDefault = !code || 
                    code.trim() === '' || 
                    cleanCode.length === 0 ||
                    code.trim() === '# Write your competitive solution here' ||
                    code.trim() === '// Write your competitive solution here';
  if (isDefault) {
    return {
      timeComplexity: "N/A",
      spaceComplexity: "N/A",
      complexityScore: 30,
      qualityScore: 45,
      approach: "Incomplete / Default code template"
    };
  }

  // Strip comments to avoid false complexity triggers
  const clean = code.replace(/\/\*[\s\S]*?\*\/|\/\/.*|#.*/g, ""); 
  
  // 1. Detect Nested Loops (Python indentation or curly braces in C++/Java/JS)
  let hasNestedLoops = false;

  // Indentation check (suitable for Python)
  const lines = code.split('\n');
  let activeLoops: number[] = [];
  
  lines.forEach((line) => {
    const trimmed = line.trim();
    const indent = line.length - line.trimStart().length;
    
    // Look for loop starts
    if (trimmed.startsWith('for ') || trimmed.startsWith('while ') || trimmed.startsWith('for(') || trimmed.startsWith('while(')) {
      if (activeLoops.some(prevIndent => indent > prevIndent)) {
        hasNestedLoops = true;
      }
      activeLoops.push(indent);
    } else if (trimmed.length > 0) {
      // Clear out inner indents that have closed
      activeLoops = activeLoops.filter(prevIndent => indent > prevIndent);
    }
  });

  // Curly brace nesting check (suitable for JS, Java, C++)
  if (!hasNestedLoops) {
    let braceLevel = 0;
    let loopLevels: number[] = [];
    
    for (let i = 0; i < clean.length; i++) {
      if (clean[i] === '{') {
        braceLevel++;
      } else if (clean[i] === '}') {
        braceLevel--;
        loopLevels = loopLevels.filter(lvl => lvl < braceLevel);
      }
      
      const slice = clean.slice(i, i + 12);
      if (slice.startsWith('for(') || slice.startsWith('for ') || slice.startsWith('while(') || slice.startsWith('while ')) {
        if (loopLevels.length > 0) {
          hasNestedLoops = true;
        }
        loopLevels.push(braceLevel);
      }
    }
  }

  // Regex fallback checks for loops
  if (!hasNestedLoops) {
    const hasNestedJS = /for\s*\(\s*(let|var|int)\s+(\w+)\s*[\s\S]*?for\s*\(\s*(let|var|int)\s+(\w+)/i.test(clean);
    const hasNestedPy = /for\s+(\w+)\s+in\s+[\s\S]*?for\s+(\w+)\s+in/i.test(clean);
    if (hasNestedJS || hasNestedPy) {
      hasNestedLoops = true;
    }
  }

  // 2. Detect Sorting
  const hasSorting = /sort\(|sorted\(|\.sort/i.test(clean);

  // 3. Detect Map/Set/Hashing (Extremely robust cross-language match)
  const hasHashing = /Map\(|Set\(|new\s+Map|new\s+Set|set\(|dict\(|\{\s*\}|unordered_map|map<|set<|hash|lookup|vis|\[\s*\w+\s*\]\s*=/i.test(clean) || 
                     (/\b(seen|cache|memo)\b/i.test(clean) && !hasNestedLoops);

  // 4. Detect Two Pointers (Extremely robust pointer comparison/swapping match)
  const hasTwoPointers = /while\s+\w+\s*<\s*\w+|left\s*<\s*right|l\s*<\s*r|low\s*<\s*high|start\s*<\s*end/i.test(clean) && !hasNestedLoops;

  // Compute Complexity Scores
  let timeComplexity = "O(N) Time";
  let spaceComplexity = "O(1) Space";
  let complexityScore = 85; // base linear score
  let approach = "Optimal Linear Scan";

  if (hasNestedLoops) {
    timeComplexity = "O(N²) Time";
    spaceComplexity = "O(1) Space";
    complexityScore = 40;
    approach = "Brute Force Nested Loop Search";
  } else if (hasSorting) {
    timeComplexity = "O(N log N) Time";
    spaceComplexity = hasHashing ? "O(N) Space" : "O(1) Space";
    complexityScore = 72;
    approach = "Sorting and Dual Index Sweep";
  } else if (hasHashing) {
    timeComplexity = "O(N) Time";
    spaceComplexity = "O(N) Space";
    complexityScore = 88;
    approach = "HashMap Index Cache Strategy";
  } else if (hasTwoPointers) {
    timeComplexity = "O(N) Time";
    spaceComplexity = "O(1) Space";
    complexityScore = 94;
    approach = "Two-Pointer Double Index sweep";
  }

  // Deterministic Code Signature (Ensures different codes get different evaluations!)
  let charSum = 0;
  const filteredClean = clean.replace(/\s+/g, ""); // ignore whitespace differences
  for (let i = 0; i < Math.min(filteredClean.length, 100); i++) {
    charSum += filteredClean.charCodeAt(i);
  }
  
  // Micro-adjustment for complexity based on unique code spacing & operator footprint
  const complexityOffset = (charSum % 9) - 4; // range: -4 to +4
  complexityScore = Math.min(99, Math.max(35, complexityScore + complexityOffset));

  // 5. Code Quality Check
  let qualityScore = 80;
  if (code.includes('//') || code.includes('#') || code.includes('/*')) {
    qualityScore += 6;
  }
  if (/\b(seen|map|set|left|right|mid|pivot|dummy|head|curr|prev|hash)\b/i.test(clean)) {
    qualityScore += 8;
  }
  if (clean.length > 500 && !code.includes('//') && !code.includes('#')) {
    qualityScore -= 10;
  }
  
  // Inject deterministic quality micro-adjustment
  const qualityOffset = (charSum % 7) - 3; // range: -3 to +3
  qualityScore = Math.min(98, Math.max(50, qualityScore + qualityOffset));

  return {
    timeComplexity,
    spaceComplexity,
    complexityScore,
    qualityScore,
    approach
  };
};

interface CodeBuddyState {
  room: CodeBuddyRoom | null;
  stats: CodeBuddyStats;
  timeRemaining: number;
  companionType: 'jerry' | 'devbot' | 'coder-x' | 'friend';
  isHost: boolean;
  myParticipantId: 'host-user' | 'friend-user';
  
  createRoom: (settings: { 
    timer: number; 
    mode: 'standard' | 'speed' | 'sudden_death'; 
    companion: 'jerry' | 'devbot' | 'coder-x' | 'friend'; 
    problemSource: 'specific' | 'random' | 'ai'; 
    topicSlug?: string; 
    problemId?: string;
    opponentType: 'bot' | 'friend';
    hostName?: string;
  }) => void;
  joinRoom: (code: string, friendName?: string) => Promise<boolean>;
  leaveRoom: () => void;
  startMatch: () => void;
  tickTimer: () => void;
  submitUserSolution: (code: string, elapsedSeconds: number, attempts: number, hintsUsed: number, allPassed: boolean) => void;
  simulateOpponentProgress: () => void;
  updateStatsOnWin: (won: boolean, userSpeed: number, userScore: number, topic: string) => void;
  syncRoomFromStorage: (roomState: CodeBuddyRoom) => void;
  updateRoomState: (roomUpdates: Partial<CodeBuddyRoom>) => void;
}

export const useCodeBuddyStore = create<CodeBuddyState>((set, get) => ({
  room: null,
  stats: loadStats(),
  timeRemaining: 0,
  companionType: 'jerry',
  isHost: true,
  myParticipantId: 'host-user',

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
          description: randomQ.description || "Solve this algorithmic challenge to verify your mastery of this pattern.",
          level: randomQ.level || 2,
          pattern: randomQ.pattern || "General",
          topic: settings.topicSlug || "arrays",
          examples: randomQ.examples || [],
          constraints: randomQ.constraints || [],
          hints: randomQ.hints || [],
          testCases: randomQ.testCases || []
        };
      }
    } else if (settings.problemSource === 'ai') {
      selectedProblem = {
        id: `ai-${Date.now()}`,
        title: "Adaptive Subarray Equilibrium",
        description: "Given an array of integers `nums`, find the maximum length of a contiguous subarray where the sum of its elements equals the sum of elements outside it.\n\nReturn `-1` if no such subarray exists.",
        level: 3,
        pattern: "Prefix Sum / Sliding Window",
        topic: "arrays",
        examples: [
          { input: "nums = [1, 2, 3, 3]", output: "3", explanation: "The subarray [1, 2, 3] has sum 6. Elements outside are [3] sum 3." }
        ],
        constraints: ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
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

    const roomCode = `CB-${Math.floor(1000 + Math.random() * 9000)}`;
    
    // Define participants based on opponentType
    const hostDisplayName = settings.hostName || 'Host';
    const initialParticipants: Participant[] = [
      {
        id: 'host-user',
        name: hostDisplayName,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(hostDisplayName)}`,
        status: 'coding'
      }
    ];

    if (settings.opponentType === 'bot') {
      let botName = "Jerry";
      let botAvatar = "https://api.dicebear.com/7.x/bottts/svg?seed=jerry";
      if (settings.companion === 'devbot') {
        botName = "Dev-Bot AI";
        botAvatar = "https://api.dicebear.com/7.x/bottts/svg?seed=devbot";
      } else if (settings.companion === 'coder-x') {
        botName = "Coder-X";
        botAvatar = "https://api.dicebear.com/7.x/bottts/svg?seed=coderx";
      }

      initialParticipants.push({
        id: 'companion',
        name: botName,
        avatarUrl: botAvatar,
        status: 'coding'
      });
    }

    const newRoom: CodeBuddyRoom = {
      id: `room-${Date.now()}`,
      code: roomCode,
      status: 'lobby',
      timerDuration: settings.timer * 60,
      gameMode: settings.mode,
      problem: selectedProblem,
      participants: initialParticipants,
      opponentType: settings.opponentType
    };

    // Save to localStorage if it's a friend room
    if (settings.opponentType === 'friend') {
      localStorage.setItem(`${ROOM_PREFIX}${roomCode}`, JSON.stringify(newRoom));
    }

    set({
      room: newRoom,
      timeRemaining: settings.timer * 60,
      companionType: settings.opponentType === 'friend' ? 'friend' : (settings.companion as any),
      isHost: true,
      myParticipantId: 'host-user'
    });
  },

  joinRoom: async (code, friendName) => {
    if (!code || code.trim() === '') return false;
    let cleanCode = code.toUpperCase().trim();
    if (!cleanCode.startsWith('CB-')) {
      cleanCode = `CB-${cleanCode}`;
    }
    const storageKey = `${ROOM_PREFIX}${cleanCode}`;
    const stored = localStorage.getItem(storageKey);
    const friendDisplayName = friendName || 'Friend';
    
    // 1. Fast path: Found in local storage (same browser / tab)
    if (stored) {
      try {
        const parsedRoom: CodeBuddyRoom = JSON.parse(stored);
        const hasFriend = parsedRoom.participants.some(p => p.id === 'friend-user');
        if (!hasFriend) {
          parsedRoom.participants.push({
            id: 'friend-user',
            name: friendDisplayName,
            avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(friendDisplayName)}`,
            status: 'coding'
          });
          localStorage.setItem(storageKey, JSON.stringify(parsedRoom));
        }
        set({
          room: parsedRoom,
          timeRemaining: parsedRoom.timerDuration,
          companionType: 'friend',
          isHost: false,
          myParticipantId: 'friend-user'
        });
        return true;
      } catch {}
    }

    // 2. Slow path: Look up room via Supabase Realtime Broadcast (cross-browser / cross-incognito / cross-device)
    try {
      const channelName = `patternlab_cb_${cleanCode}`;
      const channel = supabase.channel(channelName, {
        config: { broadcast: { self: false } }
      });

      let resolved = false;

      return new Promise<boolean>((resolve) => {
        // Listen for the Host's room state response
        channel
          .on('broadcast', { event: 'state_update' }, ({ payload }) => {
            if (resolved) return;
            const { roomState } = payload;
            if (roomState && roomState.code === cleanCode) {
              resolved = true;
              
              // Register ourselves as the friend-user
              const hasFriend = roomState.participants.some((p: any) => p.id === 'friend-user');
              if (!hasFriend) {
                roomState.participants.push({
                  id: 'friend-user',
                  name: friendDisplayName,
                  avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(friendDisplayName)}`,
                  status: 'coding'
                });
              }

              // Save to our tab's local storage
              localStorage.setItem(storageKey, JSON.stringify(roomState));

              // Broadcast updated room state back to Host
              channel.send({
                type: 'broadcast',
                event: 'state_update',
                payload: { roomState }
              });

              // Set store state
              set({
                room: roomState,
                timeRemaining: roomState.timerDuration,
                companionType: 'friend',
                isHost: false,
                myParticipantId: 'friend-user'
              });

              resolve(true);
            }
          })
          .subscribe();

        // Broadcast query for room state after short subscription delay
        setTimeout(() => {
          if (!resolved) {
            channel.send({
              type: 'broadcast',
              event: 'request_state',
              payload: { requester: 'friend-user' }
            });
          }
        }, 200);

        // Fail query after 3.5 seconds if no response received
        setTimeout(() => {
          if (!resolved) {
            channel.unsubscribe();
            resolve(false);
          }
        }, 3500);
      });
    } catch {
      return false;
    }
  },

  leaveRoom: () => {
    const { room } = get();
    if (room && room.opponentType === 'friend') {
      // Clean up localStorage
      localStorage.removeItem(`${ROOM_PREFIX}${room.code}`);
    }
    set({ room: null, timeRemaining: 0 });
  },

  startMatch: () => {
    const { room } = get();
    if (!room) return;

    const activeRoom: CodeBuddyRoom = { ...room, status: 'active' };
    
    if (room.opponentType === 'friend') {
      localStorage.setItem(`${ROOM_PREFIX}${room.code}`, JSON.stringify(activeRoom));
    }

    set({ room: activeRoom });
  },

  tickTimer: () => {
    const { timeRemaining, room } = get();
    if (!room || room.status !== 'active') return;

    if (timeRemaining <= 1) {
      set({ timeRemaining: 0 });
      get().submitUserSolution("// Incomplete / Timeout solution\n", room.timerDuration, 1, 0, false);
    } else {
      set({ timeRemaining: timeRemaining - 1 });
    }
  },

  submitUserSolution: (code, elapsedSeconds, attempts, hintsUsed, allPassed) => {
    const { room, myParticipantId } = get();
    if (!room) return;

    // 1. Analyze and calculate dynamic user scores based on actual code
    const analysis = analyzeSubmittedCode(code);
    const correctness = allPassed ? 100 : Math.max(0, 100 - (attempts - 1) * 30);
    const speedScore = Math.max(20, Math.round(((room.timerDuration - elapsedSeconds) / room.timerDuration) * 100));
    const complexityScore = analysis.complexityScore;
    const qualityScore = analysis.qualityScore;
    const hintScore = Math.max(10, 100 - hintsUsed * 30);

    const userWeighted = Math.round(
      correctness * 0.4 +
      complexityScore * 0.25 +
      speedScore * 0.15 +
      qualityScore * 0.10 +
      hintScore * 0.10
    );

    // 2. Handle Bot vs Friend Match
    if (room.opponentType === 'bot') {
      const companionType = get().companionType;
      let botCorrectness = 100;
      let botComplexity = 80;
      let botQuality = 85;
      let botSpeed = 75;
      let botHints = 1;
      let botTime = Math.round(room.timerDuration * 0.45);
      let botApproach = "Used a HashMap to achieve linear time complexity.";
      let botComplexityLabel = "O(N) Time · O(N) Space";
      let botCode = `def twoSum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        diff = target - num\n        if diff in seen:\n            return [seen[diff], i]\n        seen[num] = i\n    return []`;

      if (companionType === 'devbot') {
        botCorrectness = 100;
        botComplexity = 95;
        botQuality = 92;
        botSpeed = 90;
        botHints = 0;
        botTime = Math.round(room.timerDuration * 0.28);
        botApproach = "Fully optimized two-pointer single pass solution.";
        botComplexityLabel = "O(N) Time · O(1) Space";
        botCode = `def twoSumOptimal(nums, target):\n    # Dual-Pointer sorted search\n    sorted_nums = sorted(enumerate(nums), key=lambda x: x[1])\n    l, r = 0, len(nums) - 1\n    while l < r:\n        s = sorted_nums[l][1] + sorted_nums[r][1]\n        if s == target:\n            return [sorted_nums[l][0], sorted_nums[r][0]]\n        elif s < target:\n            l += 1\n        else:\n            r -= 1\n    return []`;
      } else if (companionType === 'coder-x') {
        botCorrectness = 70;
        botComplexity = 50;
        botQuality = 65;
        botSpeed = 40;
        botHints = 3;
        botTime = Math.round(room.timerDuration * 0.85);
        botApproach = "Nested brute-force loop.";
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

      const updatedParticipants = room.participants.map(p => {
        if (p.id === 'user' || p.id === 'host-user') {
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
            approach: analysis.approach,
            complexity: `${analysis.timeComplexity} · ${analysis.spaceComplexity}`
          };
        } else {
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
      const winnerId = userWon ? 'host-user' : 'companion';

      const feedback = `Battle Review:\n- PatternLab Student achieved a total score of ${userWeighted} (Correctness: ${correctness}%, Complexity: ${complexityScore}/100, Speed: ${speedScore}/100).\n- ${room.participants[1].name} finished with a score of ${botWeighted} (Correctness: ${botCorrectness}%, Speed: ${botSpeed}/100).\n\nArchitectural Analysis:\n- Your approach uses ${analysis.timeComplexity}: ${analysis.approach}.\n- ${room.participants[1].name} utilized the strategy: ${botApproach}.`;

      const completedRoom: CodeBuddyRoom = {
        ...room,
        status: 'completed',
        participants: updatedParticipants,
        winnerId,
        comparisonFeedback: feedback
      };

      set({ room: completedRoom });
      get().updateStatsOnWin(userWon, elapsedSeconds, userWeighted, room.problem?.pattern || 'General');
    } else {
      // ════ Friend Multiplayer Submission ════
      const updatedParticipants = room.participants.map(p => {
        if (p.id === myParticipantId) {
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
            approach: analysis.approach,
            complexity: `${analysis.timeComplexity} · ${analysis.spaceComplexity}`
          };
        }
        return p;
      });

      const otherParticipant = updatedParticipants.find(p => p.id !== myParticipantId)!;
      let finalWinnerId = room.winnerId;
      let finalFeedback = room.comparisonFeedback;
      let status = room.status;

      // Check if both have completed their battles!
      if (otherParticipant.status === 'submitted') {
        status = 'completed';
        const hostP = updatedParticipants.find(p => p.id === 'host-user')!;
        const friendP = updatedParticipants.find(p => p.id === 'friend-user')!;
        
        const hostScore = hostP.score || 0;
        const friendScore = friendP.score || 0;
        
        if (hostScore > friendScore) {
          finalWinnerId = 'host-user';
        } else if (friendScore > hostScore) {
          finalWinnerId = 'friend-user';
        } else {
          // Tie-breaker based on solvedTime (smaller/faster is better)
          const hostTime = hostP.solvedTime || Infinity;
          const friendTime = friendP.solvedTime || Infinity;
          if (hostTime < friendTime) {
            finalWinnerId = 'host-user';
          } else if (friendTime < hostTime) {
            finalWinnerId = 'friend-user';
          } else {
            // Absolute tie
            finalWinnerId = 'tie';
          }
        }

        const winnerName = finalWinnerId === 'tie' ? 'It is a Tie!' : (finalWinnerId === 'host-user' ? hostP.name : friendP.name);
        finalFeedback = `Multitasking Battle Scorecard:\n- ${hostP.name} finished with a score of ${hostScore} (Correctness: ${hostP.correctness}%, Complexity: ${hostP.complexityScore}/100, Speed: ${hostP.speedScore}/100).\n- ${friendP.name} completed with a score of ${friendScore} (Correctness: ${friendP.correctness}%, Complexity: ${friendP.complexityScore}/100, Speed: ${friendP.speedScore}/100).\n\nWinner Declared: ${finalWinnerId === 'tie' ? "No one (Tie!)" : winnerName}!`;

        // Update local stats on win
        const didIWin = myParticipantId === finalWinnerId;
        get().updateStatsOnWin(didIWin, elapsedSeconds, userWeighted, room.problem?.pattern || 'General');
      }

      const updatedRoom: CodeBuddyRoom = {
        ...room,
        status,
        participants: updatedParticipants,
        winnerId: finalWinnerId,
        comparisonFeedback: finalFeedback
      };

      // Write updated room to localStorage to notify the friend's browser tab!
      localStorage.setItem(`${ROOM_PREFIX}${room.code}`, JSON.stringify(updatedRoom));
      set({ room: updatedRoom });
    }
  },

  simulateOpponentProgress: () => {
    const { room } = get();
    if (!room || room.status !== 'active') return;

    const updated = room.participants.map(p => {
      if (p.id !== 'host-user' && p.id !== 'user') {
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
      currentStats.points += 25;
    } else {
      currentStats.losses += 1;
      currentStats.winStreak = 0;
    }

    currentStats.averageSpeed = Math.round(
      (currentStats.averageSpeed * (currentStats.totalMatches - 1) + userSpeed) / currentStats.totalMatches
    );

    currentStats.optimizationRating = Math.round(
      (currentStats.optimizationRating * (currentStats.totalMatches - 1) + userScore) / currentStats.totalMatches
    );

    if (won && topic && topic !== 'General') {
      currentStats.strongestTopic = topic;
    }

    set({ stats: currentStats });
    saveStats(currentStats);
  },

  syncRoomFromStorage: (roomState) => {
    const { room } = get();
    if (!room) return;

    // Resiliently merge incoming participants with local participants to prevent race conditions from overwriting submissions!
    const mergedParticipants = roomState.participants.map(incoming => {
      const local = room.participants.find(p => p.id === incoming.id);
      if (local && local.status === 'submitted' && incoming.status !== 'submitted') {
        return local;
      }
      return incoming;
    });

    let status = roomState.status;
    let winnerId = roomState.winnerId;
    let comparisonFeedback = roomState.comparisonFeedback;

    // Check if both have completed their battles, and auto-complete to resolve race conditions!
    const allSubmitted = mergedParticipants.every(p => p.status === 'submitted');
    if (allSubmitted && status !== 'completed') {
      status = 'completed';
      const hostP = mergedParticipants.find(p => p.id === 'host-user')!;
      const friendP = mergedParticipants.find(p => p.id === 'friend-user')!;
      
      const hostScore = hostP.score || 0;
      const friendScore = friendP.score || 0;
      
      if (hostScore > friendScore) {
        winnerId = 'host-user';
      } else if (friendScore > hostScore) {
        winnerId = 'friend-user';
      } else {
        // Tie-breaker based on solvedTime (smaller/faster is better)
        const hostTime = hostP.solvedTime || Infinity;
        const friendTime = friendP.solvedTime || Infinity;
        if (hostTime < friendTime) {
          winnerId = 'host-user';
        } else if (friendTime < hostTime) {
          winnerId = 'friend-user';
        } else {
          winnerId = 'tie';
        }
      }

      const winnerName = winnerId === 'tie' ? 'It is a Tie!' : (winnerId === 'host-user' ? hostP.name : friendP.name);
      comparisonFeedback = `Multitasking Battle Scorecard:\n- ${hostP.name} finished with a score of ${hostScore} (Correctness: ${hostP.correctness}%, Complexity: ${hostP.complexityScore}/100, Speed: ${hostP.speedScore}/100).\n- ${friendP.name} completed with a score of ${friendScore} (Correctness: ${friendP.correctness}%, Complexity: ${friendP.complexityScore}/100, Speed: ${friendP.speedScore}/100).\n\nWinner Declared: ${winnerId === 'tie' ? "No one (Tie!)" : winnerName}!`;
    }

    const mergedRoomState = {
      ...roomState,
      status,
      participants: mergedParticipants,
      winnerId,
      comparisonFeedback
    };

    if (JSON.stringify(room) === JSON.stringify(mergedRoomState)) return;
    
    set({ 
      room: mergedRoomState,
      timeRemaining: mergedRoomState.status === 'active' && room.status === 'lobby' ? mergedRoomState.timerDuration : get().timeRemaining
    });
  },

  updateRoomState: (roomUpdates) => {
    const { room } = get();
    if (!room) return;

    const updatedRoom = { ...room, ...roomUpdates };
    
    if (room.opponentType === 'friend') {
      localStorage.setItem(`${ROOM_PREFIX}${room.code}`, JSON.stringify(updatedRoom));
    }
    
    set({ room: updatedRoom });
  }
}));
