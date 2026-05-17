export interface PatternData {
  id: string;
  title: string;
}

export interface TopicData {
  id: string;
  title: string;
  patterns: PatternData[];
}

export const roadmapData: TopicData[] = [
  {
    id: "t1",
    title: "ARRAY",
    patterns: [
      { id: "p1_1", title: "Two-Pointer" },
      { id: "p1_2", title: "Sliding Window" },
      { id: "p1_3", title: "Prefix Sum" },
      { id: "p1_4", title: "Kadane's Algorithm" },
    ]
  },
  {
    id: "t2",
    title: "STRINGS",
    patterns: [
      { id: "p2_1", title: "Two-Pointer (Palindrome)" },
      { id: "p2_2", title: "Sliding Window (String)" },
    ]
  },
  {
    id: "t3",
    title: "BINARY SEARCH",
    patterns: [
      { id: "p3_1", title: "Classic Binary Search" },
      { id: "p3_2", title: "Lower / Upper Bound" },
      { id: "p3_3", title: "Binary Search on Answers" },
      { id: "p3_4", title: "Search in 2D Matrix" },
    ]
  },
  {
    id: "t4",
    title: "STACK",
    patterns: [
      { id: "p4_1", title: "Monotonic Stack" },
      { id: "p4_2", title: "Expression Evaluation" },
      { id: "p4_3", title: "Stack Simulation / Undo Operation" },
      { id: "p4_4", title: "Parenthesis & Scoring" },
      { id: "p4_5", title: "Stack-Based Design" },
      { id: "p4_6", title: "Stack + Greedy" },
      { id: "p4_7", title: "Recursive Stack" },
    ]
  },
  {
    id: "t5",
    title: "RECURSION",
    patterns: [
      { id: "p5_1", title: "Linear Recursion" },
      { id: "p5_2", title: "Non-Linear Recursion" },
      { id: "p5_3", title: "Divide & Conquer" },
      { id: "p5_4", title: "Recursion on LinkedList/Stack" },
      { id: "p5_5", title: "Subsequences" },
    ]
  },
  {
    id: "t6",
    title: "LINKED LIST",
    patterns: [
      { id: "p6_1", title: "Basic Operations" },
      { id: "p6_2", title: "Fast and Slow Pointers" },
      { id: "p6_3", title: "Reversal Pattern" },
      { id: "p6_4", title: "Merge / Sort" },
      { id: "p6_5", title: "Linked List + Stack" },
    ]
  },
  {
    id: "t7",
    title: "DOUBLE LINKED LIST",
    patterns: [
      { id: "p7_1", title: "Basic DLL Operations" },
      { id: "p7_2", title: "Merge / Sort / Reorder" },
    ]
  },
  {
    id: "t8",
    title: "HASHMAP",
    patterns: [
      { id: "p8_1", title: "Frequency Map / Counting" },
      { id: "p8_2", title: "Prefix-Sum with Map" },
      { id: "p8_3", title: "Sliding Window + HashMap" },
    ]
  },
  {
    id: "t9",
    title: "HEAP",
    patterns: [
      { id: "p9_1", title: "Top-K Elements" },
      { id: "p9_2", title: "Merge K Sorted" },
      { id: "p9_3", title: "Heap with Sliding Window" },
      { id: "p9_4", title: "Implementation of Heap" },
      { id: "p9_5", title: "Huffman pattern" },
    ]
  },
  {
    id: "t10",
    title: "TREE",
    patterns: [
      { id: "p10_1", title: "DFS Traversals" },
      { id: "p10_2", title: "BFS / Level-Order" },
      { id: "p10_3", title: "Lowest Common Ancestor" },
      { id: "p10_4", title: "Serialization / Construction" },
    ]
  },
  {
    id: "t11",
    title: "BINARY SEARCH TREE",
    patterns: [
      { id: "p11_1", title: "BST Operations" },
      { id: "p11_2", title: "LCA & Range Queries" },
    ]
  },
  {
    id: "t12",
    title: "GRAPH",
    patterns: [
      { id: "p12_1", title: "BFS (Unweighted Path)" },
      { id: "p12_2", title: "DFS (Connectivity)" },
      { id: "p12_3", title: "Topological Sort" },
      { id: "p12_4", title: "MST / Union-Find" },
      { id: "p12_5", title: "Dijkstra (Weighted)" },
      { id: "p12_6", title: "Bellman-Ford" },
      { id: "p12_7", title: "Floyd-Warshall" },
    ]
  },
  {
    id: "t13",
    title: "BACKTRACKING",
    patterns: [
      { id: "p13_1", title: "Choice-Based Backtracking" },
      { id: "p13_2", title: "Constraint-Based Backtracking" },
      { id: "p13_3", title: "Grid / Path Backtracking" },
      { id: "p13_4", title: "Decision Tree / Sequence Generation" },
    ]
  },
  {
    id: "t14",
    title: "GREEDY",
    patterns: [
      { id: "p14_1", title: "Intervals & Reach" },
      { id: "p14_2", title: "Sorting / Local Choice" },
    ]
  },
  {
    id: "t15",
    title: "DYNAMIC PROGRAMMING",
    patterns: [
      { id: "p15_1", title: "1D / Linear DP" },
      { id: "p15_2", title: "2D / Grid DP" },
      { id: "p15_3", title: "DP on Strings" },
      { id: "p15_4", title: "DP on Intervals" },
      { id: "p15_5", title: "DP on Trees / DAGs" },
      { id: "p15_6", title: "Knapsack / Subset Sum" },
      { id: "p15_7", title: "DP on Stocks" },
    ]
  },
  {
    id: "t16",
    title: "TRIE",
    patterns: [
      { id: "p16_1", title: "Basic Trie Operations" },
      { id: "p16_2", title: "Word Break / Segmentation" },
      { id: "p16_3", title: "Bitwise Trie / XOR" },
    ]
  },
  {
    id: "t17",
    title: "BIT MANIPULATION",
    patterns: [
      { id: "p17_1", title: "Basic Bit Operations" },
      { id: "p17_2", title: "Subsets / Bitmask" },
      { id: "p17_3", title: "Advanced XOR" },
    ]
  }
];
