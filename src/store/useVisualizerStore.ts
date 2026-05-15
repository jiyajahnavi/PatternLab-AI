import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DSType = 'stack' | 'queue' | 'array' | 'linked-list' | 'binary-tree' | 'graph' | 'binary-search';

export interface DryRunStep {
  step: number;
  description: string;         // what's happening this step
  highlight: number[];          // indices to highlight in data
  state: Record<string, any>;  // current state (map, pointer, etc.)
  code?: string;               // optional pseudocode line
}

interface VisualizerState {
  activeTopic: DSType;
  contextMessage: string;
  dryRunSteps: DryRunStep[];
  autoStartDryRun: boolean;
  setTopic: (topic: DSType, context?: string, steps?: DryRunStep[]) => void;
  setAutoStart: (v: boolean) => void;
}

export const useVisualizerStore = create<VisualizerState>()(
  persist(
    (set) => ({
      activeTopic: 'stack',
      contextMessage: '',
      dryRunSteps: [],
      autoStartDryRun: false,
      setTopic: (topic, context = '', steps = []) =>
        set({ activeTopic: topic, contextMessage: context, dryRunSteps: steps }),
      setAutoStart: (v) => set({ autoStartDryRun: v }),
    }),
    { name: 'visualizer-store' }
  )
);

// Detect DS/algorithm from text
export const detectDSTopic = (text: string): DSType | null => {
  const lower = text.toLowerCase();
  if (lower.includes('binary search')) return 'binary-search';
  if (lower.includes('binary tree') || lower.includes('bst') || lower.includes('tree traversal')) return 'binary-tree';
  if (lower.includes('linked list') || lower.includes('linked-list')) return 'linked-list';
  if (lower.includes('graph') || lower.includes('dijkstra')) return 'graph';
  if (lower.includes('bfs') || lower.includes('queue') || lower.includes('deque')) return 'queue';
  if (lower.includes('stack') || lower.includes('lifo') || lower.includes('monotonic stack')) return 'stack';
  if (lower.includes('array') || lower.includes('two pointer') || lower.includes('sliding window') || lower.includes('prefix sum') || lower.includes('hashmap') || lower.includes('two sum')) return 'array';
  return null;
};

// Detect if user is asking for explanation/approach/dry-run
export const isExplainRequest = (text: string): boolean => {
  const lower = text.toLowerCase();
  return (
    lower.includes('explain') || lower.includes('optimal approach') ||
    lower.includes('dry run') || lower.includes('how does') ||
    lower.includes('walk me') || lower.includes('walkthrough') ||
    lower.includes('step by step') || lower.includes('visualize') ||
    lower.includes('show me') || lower.includes('how to solve')
  );
};

// Pre-built dry-run steps per topic for the sample data
export const getDryRunSteps = (topic: DSType): DryRunStep[] => {
  switch (topic) {
    case 'array': return [
      { step: 1, description: 'Initialize: Create empty HashMap seen = {}', highlight: [], state: { seen: {}, i: -1 }, code: 'seen = {}' },
      { step: 2, description: 'i=0: num=2, complement = 9-2 = 7. Not in seen. Add {2:0}', highlight: [0], state: { seen: { 2: 0 }, i: 0, complement: 7 }, code: 'complement = target - nums[i]' },
      { step: 3, description: 'i=1: num=7, complement = 9-7 = 2. Found 2 in seen at index 0!', highlight: [0, 1], state: { seen: { 2: 0 }, i: 1, complement: 2, found: true }, code: 'if complement in seen: return [seen[complement], i]' },
      { step: 4, description: '✅ Return [0, 1] — nums[0]+nums[1] = 2+7 = 9 = target', highlight: [0, 1], state: { result: '[0, 1]', found: true }, code: 'return [0, 1]' },
    ];
    case 'stack': return [
      { step: 1, description: 'Push(10): Stack is empty, add 10 at top', highlight: [0], state: { stack: [10] }, code: 'stack.push(10)' },
      { step: 2, description: 'Push(20): Add 20 on top of 10', highlight: [1], state: { stack: [10, 20] }, code: 'stack.push(20)' },
      { step: 3, description: 'Push(30): Add 30 on top of 20', highlight: [2], state: { stack: [10, 20, 30] }, code: 'stack.push(30)' },
      { step: 4, description: 'Pop(): Remove top element 30. Stack → [10, 20]', highlight: [1], state: { stack: [10, 20], popped: 30 }, code: 'x = stack.pop() // x = 30' },
      { step: 5, description: 'Peek(): Top element is 20, no removal', highlight: [1], state: { stack: [10, 20], top: 20 }, code: 'top = stack[-1] // 20' },
    ];
    case 'queue': return [
      { step: 1, description: 'Enqueue(A): Add A to rear', highlight: [0], state: { queue: ['A'] }, code: 'queue.enqueue("A")' },
      { step: 2, description: 'Enqueue(B): Add B to rear', highlight: [1], state: { queue: ['A', 'B'] }, code: 'queue.enqueue("B")' },
      { step: 3, description: 'Enqueue(C): Add C to rear', highlight: [2], state: { queue: ['A', 'B', 'C'] }, code: 'queue.enqueue("C")' },
      { step: 4, description: 'Dequeue(): Remove A from front → FIFO order', highlight: [0], state: { queue: ['B', 'C'], removed: 'A' }, code: 'x = queue.dequeue() // x = A' },
    ];
    case 'binary-search': return [
      { step: 1, description: 'lo=0, hi=7, mid=3. arr[3]=12. Target=23 > 12 → search right', highlight: [3], state: { lo: 0, hi: 7, mid: 3, compare: '23 > 12' }, code: 'mid = (lo+hi)//2' },
      { step: 2, description: 'lo=4, hi=7, mid=5. arr[5]=23. Target=23 == 23 → FOUND!', highlight: [5], state: { lo: 4, hi: 7, mid: 5, compare: '23 == 23', found: true }, code: 'if arr[mid] == target: return mid' },
      { step: 3, description: '✅ Return index 5. Binary search found 23 in O(log n)!', highlight: [5], state: { result: 5, found: true }, code: 'return 5' },
    ];
    case 'binary-tree': return [
      { step: 1, description: 'Inorder: Visit Left subtree first (node 20)', highlight: [1], state: { visited: [20], current: 20 }, code: 'inorder(node.left)' },
      { step: 2, description: 'Inorder: Visit Root (node 50)', highlight: [0], state: { visited: [20, 50], current: 50 }, code: 'print(node.val)' },
      { step: 3, description: 'Inorder: Visit Right subtree (node 70)', highlight: [2], state: { visited: [20, 50, 70], current: 70 }, code: 'inorder(node.right)' },
      { step: 4, description: '✅ Inorder traversal: [20, 50, 70] — sorted order in a BST!', highlight: [1, 0, 2], state: { result: [20, 50, 70] }, code: '// Full: 20→30→40→50→60→70→80' },
    ];
    default: return [];
  }
};

export const DS_LABELS: Record<DSType, string> = {
  'stack': 'Stack',
  'queue': 'Queue',
  'array': 'Array / HashMap',
  'linked-list': 'Linked List',
  'binary-tree': 'Binary Tree',
  'graph': 'Graph',
  'binary-search': 'Binary Search',
};
