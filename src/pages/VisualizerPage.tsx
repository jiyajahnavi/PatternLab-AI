import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, ChevronRight, ChevronLeft, Cpu } from 'lucide-react';
import { useVisualizerStore, DS_LABELS, type DSType } from '../store/useVisualizerStore';

// ─── Helpers ───────────────────────────────────────────────────────────────────
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const DS_OPTIONS: DSType[] = ['stack','queue','array','linked-list','binary-tree','graph','binary-search'];

// ─── Visualizer sub-components ────────────────────────────────────────────────

function StackViz({ data }: { data: number[] }) {
  return (
    <div className="flex flex-col-reverse items-center gap-2">
      <div className="w-48 h-2 bg-border rounded" />
      <AnimatePresence>
        {data.map((v, i) => (
          <motion.div key={`${i}-${v}`}
            initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={`w-44 h-11 flex items-center justify-between px-4 rounded-lg border font-mono text-sm ${i === data.length - 1 ? 'border-accent bg-accent/10 text-accent shadow-[0_0_12px_rgba(124,111,247,0.3)]' : 'border-border bg-surface text-primary'}`}
          >
            <span className="text-muted text-xs">{i}</span>
            <span className="font-bold">{v}</span>
            {i === data.length - 1 && <span className="text-[10px] text-accent font-bold">TOP</span>}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function QueueViz({ data }: { data: number[] }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2">
        {data.map((v, i) => (
          <motion.div key={`${i}-${v}`}
            initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
            className={`w-14 h-14 flex flex-col items-center justify-center rounded-lg border font-mono text-sm font-bold ${i === 0 ? 'border-green-500 bg-green-500/10 text-green-400' : i === data.length - 1 ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-surface text-primary'}`}
          >
            {v}
          </motion.div>
        ))}
      </div>
      <div className="flex justify-between w-full px-4 text-xs text-muted font-mono">
        <span className="text-green-400">← FRONT (dequeue)</span>
        <span className="text-accent">REAR (enqueue) →</span>
      </div>
    </div>
  );
}

function ArrayViz({ data, highlight }: { data: number[]; highlight: number }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-1">
        {data.map((v, i) => (
          <motion.div key={i}
            animate={{ scale: i === highlight ? 1.15 : 1, backgroundColor: i === highlight ? 'rgba(124,111,247,0.2)' : 'transparent' }}
            className={`w-12 h-12 flex items-center justify-center border font-mono text-sm font-bold rounded ${i === highlight ? 'border-accent text-accent shadow-[0_0_10px_rgba(124,111,247,0.4)]' : 'border-border text-primary'}`}
          >
            {v}
          </motion.div>
        ))}
      </div>
      <div className="flex gap-1">
        {data.map((_, i) => (
          <div key={i} className="w-12 text-center text-xs text-muted font-mono">{i}</div>
        ))}
      </div>
    </div>
  );
}

function LinkedListViz({ data }: { data: number[] }) {
  return (
    <div className="flex items-center gap-0 flex-wrap justify-center">
      {data.map((v, i) => (
        <div key={i} className="flex items-center">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            className={`flex flex-col border rounded-lg overflow-hidden ${i === 0 ? 'border-accent' : 'border-border'}`}
          >
            <div className={`px-4 py-2 text-sm font-mono font-bold ${i === 0 ? 'bg-accent/10 text-accent' : 'bg-surface text-primary'}`}>{v}</div>
            <div className="px-2 py-1 bg-background text-[10px] text-muted font-mono text-center border-t border-border">
              {i < data.length - 1 ? `→ node${i + 1}` : 'NULL'}
            </div>
          </motion.div>
          {i < data.length - 1 && <div className="w-6 h-0.5 bg-muted/40 flex items-center justify-center"><ChevronRight size={12} className="text-muted" /></div>}
        </div>
      ))}
    </div>
  );
}

function BinaryTreeViz({ data }: { data: number[] }) {
  const nodeAt = (i: number) => (i < data.length ? data[i] : null);
  return (
    <div className="flex flex-col items-center gap-6">
      {/* Level 0 */}
      <div className="flex justify-center">
        <TreeNode val={nodeAt(0)} highlight />
      </div>
      {/* Level 1 */}
      <div className="flex gap-24">
        <TreeNode val={nodeAt(1)} />
        <TreeNode val={nodeAt(2)} />
      </div>
      {/* Level 2 */}
      <div className="flex gap-8">
        {[3, 4, 5, 6].map(i => <TreeNode key={i} val={nodeAt(i)} />)}
      </div>
    </div>
  );
}

function TreeNode({ val, highlight }: { val: number | null; highlight?: boolean }) {
  if (val === null) return <div className="w-10 h-10 rounded-full border border-dashed border-border/30" />;
  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-mono text-sm font-bold border-2 ${highlight ? 'border-accent bg-accent/15 text-accent' : 'border-border bg-surface text-primary'}`}>
      {val}
    </div>
  );
}

function GraphViz() {
  const nodes = [
    { id: 'A', x: 200, y: 60 }, { id: 'B', x: 80, y: 180 }, { id: 'C', x: 320, y: 180 },
    { id: 'D', x: 40, y: 310 }, { id: 'E', x: 180, y: 310 }, { id: 'F', x: 360, y: 310 },
  ];
  const edges = [['A','B'],['A','C'],['B','D'],['B','E'],['C','F']];
  const getNode = (id: string) => nodes.find(n => n.id === id)!;
  return (
    <svg width="420" height="370" className="overflow-visible">
      {edges.map(([a, b], i) => {
        const na = getNode(a), nb = getNode(b);
        return <line key={i} x1={na.x} y1={na.y} x2={nb.x} y2={nb.y} stroke="#3B3B6B" strokeWidth="2" />;
      })}
      {nodes.map(n => (
        <g key={n.id}>
          <circle cx={n.x} cy={n.y} r={22} fill="#1C1C22" stroke="#7C6FF7" strokeWidth="2" />
          <text x={n.x} y={n.y + 5} textAnchor="middle" fill="#E8E8F0" fontSize={14} fontFamily="monospace" fontWeight="bold">{n.id}</text>
        </g>
      ))}
    </svg>
  );
}

function BinarySearchViz({ data, target, step }: { data: number[]; target: number; step: number }) {
  let lo = 0, hi = data.length - 1, mid = -1;
  for (let s = 0; s <= step && lo <= hi; s++) {
    mid = Math.floor((lo + hi) / 2);
    if (data[mid] === target || s === step) break;
    if (data[mid] < target) lo = mid + 1; else hi = mid - 1;
  }
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-1">
        {data.map((v, i) => (
          <div key={i} className={`w-11 h-11 flex items-center justify-center rounded border font-mono text-sm font-bold transition-all ${i === mid ? 'border-accent bg-accent/20 text-accent scale-110 shadow-[0_0_10px_rgba(124,111,247,0.4)]' : i < lo || i > hi ? 'border-border/30 bg-background text-muted/30' : 'border-border bg-surface text-primary'}`}>{v}</div>
        ))}
      </div>
      <div className="flex gap-1">
        {data.map((_, i) => (
          <div key={i} className="w-11 text-center text-[10px] text-muted font-mono">
            {i === lo && i !== mid ? '▲lo' : i === hi && i !== mid ? '▲hi' : i === mid ? '▲mid' : ''}
          </div>
        ))}
      </div>
      <div className="text-xs text-muted mt-2">Target: <span className="text-accent font-bold">{target}</span></div>
    </div>
  );
}

// ─── Explanations ─────────────────────────────────────────────────────────────
const EXPLANATIONS: Record<DSType, { title: string; description: string; ops: string[] }> = {
  stack: {
    title: 'Stack — LIFO',
    description: 'A stack follows Last-In, First-Out. The last element pushed is the first one popped. Think of a stack of plates.',
    ops: ['Push: Add element to the top — O(1)', 'Pop: Remove element from top — O(1)', 'Peek: View top without removing — O(1)', 'Use cases: Undo/redo, DFS, expression parsing'],
  },
  queue: {
    title: 'Queue — FIFO',
    description: 'A queue follows First-In, First-Out. Elements are added at the rear and removed from the front. Like a line at a ticket counter.',
    ops: ['Enqueue: Add to rear — O(1)', 'Dequeue: Remove from front — O(1)', 'Front: Peek first element — O(1)', 'Use cases: BFS, task scheduling, print queues'],
  },
  array: {
    title: 'Array — Indexed Access',
    description: 'Arrays store elements in contiguous memory. Constant-time random access via index. Insertion/deletion in the middle is O(n).',
    ops: ['Access by index — O(1)', 'Search (linear) — O(n)', 'Insert/Delete at end — O(1) amortized', 'Insert/Delete at middle — O(n)'],
  },
  'linked-list': {
    title: 'Linked List — Node Chain',
    description: 'Each node holds a value and a pointer to the next. No contiguous memory needed. Great for dynamic insert/delete at head.',
    ops: ['Access — O(n)', 'Insert/Delete at head — O(1)', 'Insert/Delete in middle — O(n)', 'Use cases: LRU cache, undo history, adjacency list'],
  },
  'binary-tree': {
    title: 'Binary Tree — Hierarchical',
    description: 'Each node has at most two children (left, right). BST property: left < node < right. Foundation for heaps, segment trees.',
    ops: ['Inorder: Left → Node → Right', 'Preorder: Node → Left → Right', 'Postorder: Left → Right → Node', 'Height: O(log n) balanced, O(n) worst'],
  },
  graph: {
    title: 'Graph — Vertices & Edges',
    description: 'A graph G = (V, E) consists of vertices and edges. Can be directed or undirected, weighted or unweighted.',
    ops: ['BFS: Level-by-level traversal — O(V+E)', 'DFS: Depth-first search — O(V+E)', 'Dijkstra: Shortest weighted path — O(E log V)', 'Use cases: Social networks, routing, dependencies'],
  },
  'binary-search': {
    title: 'Binary Search — Divide & Conquer',
    description: 'Efficiently find a target in a sorted array. Each step eliminates half the search space, giving O(log n) time.',
    ops: ['Step 1: Find mid = (lo + hi) / 2', 'Step 2: If arr[mid] == target → found!', 'Step 3: If target > arr[mid] → search right half', 'Step 4: Else search left half'],
  },
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
export const VisualizerPage: React.FC = () => {
  const { activeTopic, contextMessage, dryRunSteps, setTopic } = useVisualizerStore();
  const [topic, setLocalTopic] = useState<DSType>(activeTopic);
  const [stackData, setStackData] = useState([10, 25, 40]);
  const [queueData, setQueueData] = useState([5, 15, 30, 45]);
  const [arrayData] = useState([2, 5, 8, 12, 16, 23, 38, 42]);
  const [arrayHL, setArrayHL] = useState(0);
  const [llData, setLlData] = useState([10, 20, 30, 40]);
  const [treeData] = useState([50, 30, 70, 20, 40, 60, 80]);
  const [bsStep, setBsStep] = useState(0);
  const [bsTarget] = useState(23);
  const [isPlaying, setIsPlaying] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [dryRunStep, setDryRunStep] = useState(0);
  const [dryRunPlaying, setDryRunPlaying] = useState(false);

  const info = EXPLANATIONS[topic];
  const hasDryRun = dryRunSteps.length > 0;
  const currentDryStep = dryRunSteps[dryRunStep] || null;

  // Sync when store changes (navigated from chat)
  useEffect(() => { 
    setLocalTopic(activeTopic); 
    setDryRunStep(0);
    setDryRunPlaying(false);
  }, [activeTopic]);

  // Auto-play dry run
  useEffect(() => {
    if (!dryRunPlaying || !hasDryRun) return;
    const id = setInterval(() => {
      setDryRunStep(s => {
        if (s >= dryRunSteps.length - 1) { setDryRunPlaying(false); return s; }
        return s + 1;
      });
    }, 1400);
    return () => clearInterval(id);
  }, [dryRunPlaying, hasDryRun, dryRunSteps.length]);

  // Mirror dry-run step into visualization highlight
  useEffect(() => {
    if (!currentDryStep) return;
    const hl = currentDryStep.highlight[0] ?? 0;
    if (topic === 'array' || topic === 'binary-search') { setArrayHL(hl); setBsStep(dryRunStep); }
  }, [dryRunStep, currentDryStep]);

  // Auto-play animation
  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      if (topic === 'array') setArrayHL(h => (h + 1) % arrayData.length);
      if (topic === 'binary-search') setBsStep(s => s < 4 ? s + 1 : 0);
    }, 800);
    return () => clearInterval(id);
  }, [isPlaying, topic]);

  const handleTopicChange = (t: DSType) => {
    setLocalTopic(t);
    setTopic(t, '', []);
    setIsPlaying(false);
    setDryRunPlaying(false);
    setDryRunStep(0);
    setBsStep(0);
    setArrayHL(0);
  };

  const handleReset = () => {
    setStackData([10, 25, 40]);
    setQueueData([5, 15, 30, 45]);
    setLlData([10, 20, 30, 40]);
    setBsStep(0); setArrayHL(0); setIsPlaying(false);
  };

  const handleStackPush = () => {
    const v = inputVal ? parseInt(inputVal) : rand(1, 99);
    setStackData(p => [...p, v]);
    setInputVal('');
  };

  const handleStackPop = () => setStackData(p => p.slice(0, -1));

  const handleEnqueue = () => {
    const v = inputVal ? parseInt(inputVal) : rand(1, 99);
    setQueueData(p => [...p, v]);
    setInputVal('');
  };

  const handleDequeue = () => setQueueData(p => p.slice(1));

  const handleLLPrepend = () => {
    const v = inputVal ? parseInt(inputVal) : rand(1, 99);
    setLlData(p => [v, ...p]);
    setInputVal('');
  };

  const handleLLDelete = () => setLlData(p => p.slice(1));

  return (
    <div className="flex h-full flex-col bg-background text-primary overflow-hidden">
      {/* Topbar */}
      <div className="h-14 border-b border-border bg-surface flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <Cpu size={18} className="text-accent" />
          <h1 className="font-bold text-base">Algorithm Visualizer</h1>
          <div className="flex gap-1 ml-4 flex-wrap">
            {DS_OPTIONS.map(ds => (
              <button key={ds} onClick={() => handleTopicChange(ds)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${topic === ds ? 'bg-accent text-background' : 'bg-background border border-border text-muted hover:text-primary'}`}
              >
                {DS_LABELS[ds]}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsPlaying(p => !p)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-background text-xs font-semibold rounded hover:opacity-90 transition-opacity">
            {isPlaying ? <><Pause size={13} /> Pause</> : <><Play size={13} /> Auto-Play</>}
          </button>
          <button onClick={handleReset} className="p-2 border border-border rounded hover:bg-surface transition-colors" title="Reset">
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-auto"
          style={{ backgroundImage: 'radial-gradient(circle, #2A2A3E 1px, transparent 1px)', backgroundSize: '28px 28px' }}>
          <AnimatePresence mode="wait">
            <motion.div key={topic} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2 }}>
              {topic === 'stack' && <StackViz data={stackData} />}
              {topic === 'queue' && <QueueViz data={queueData} />}
              {topic === 'array' && <ArrayViz data={arrayData} highlight={arrayHL} />}
              {topic === 'linked-list' && <LinkedListViz data={llData} />}
              {topic === 'binary-tree' && <BinaryTreeViz data={treeData} />}
              {topic === 'graph' && <GraphViz />}
              {topic === 'binary-search' && <BinarySearchViz data={arrayData} target={bsTarget} step={bsStep} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Panel */}
        <div className="w-80 border-l border-border bg-surface flex flex-col overflow-hidden shrink-0">

          {/* Dry-run panel — shown when navigated from chat */}
          {hasDryRun && (
            <div className="border-b border-border p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  Dry Run
                </div>
                <span className="text-[10px] text-muted font-mono">{dryRunStep + 1} / {dryRunSteps.length}</span>
              </div>

              {/* Step progress */}
              <div className="flex gap-1">
                {dryRunSteps.map((_, i) => (
                  <div key={i} onClick={() => setDryRunStep(i)}
                    className={`h-1 flex-1 rounded-full cursor-pointer transition-colors ${i <= dryRunStep ? 'bg-accent' : 'bg-border'}`} />
                ))}
              </div>

              {/* Current step card */}
              {currentDryStep && (
                <motion.div key={dryRunStep} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-background border border-accent/20 rounded-lg p-3 space-y-2">
                  <div className="text-xs font-semibold text-primary leading-snug">{currentDryStep.description}</div>
                  {currentDryStep.code && (
                    <div className="font-mono text-[11px] bg-accent/10 text-accent px-2 py-1 rounded border border-accent/20">
                      {currentDryStep.code}
                    </div>
                  )}
                  {/* State snapshot */}
                  <div className="text-[10px] text-muted font-mono">
                    {Object.entries(currentDryStep.state).map(([k, v]) => (
                      <div key={k}><span className="text-accent">{k}:</span> {JSON.stringify(v)}</div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Dry-run controls */}
              <div className="flex gap-2">
                <button onClick={() => setDryRunStep(s => Math.max(0, s - 1))}
                  className="flex-1 py-1.5 text-xs border border-border rounded bg-background hover:border-accent transition-colors flex items-center justify-center gap-1">
                  <ChevronLeft size={12} /> Prev
                </button>
                <button onClick={() => setDryRunPlaying(p => !p)}
                  className="flex-1 py-1.5 text-xs bg-accent text-background rounded hover:opacity-90 transition-opacity flex items-center justify-center gap-1">
                  {dryRunPlaying ? <><Pause size={12} /> Pause</> : <><Play size={12} /> Play</>}
                </button>
                <button onClick={() => setDryRunStep(s => Math.min(dryRunSteps.length - 1, s + 1))}
                  className="flex-1 py-1.5 text-xs border border-border rounded bg-background hover:border-accent transition-colors flex items-center justify-center gap-1">
                  Next <ChevronRight size={12} />
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
            {/* Operations */}
            <div>
              <div className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Operations</div>
              <div className="flex gap-2 mb-2">
                <input value={inputVal} onChange={e => setInputVal(e.target.value)} placeholder="Value"
                  className="flex-1 bg-background border border-border rounded px-2 py-1.5 text-sm text-primary placeholder:text-muted/50 outline-none focus:border-accent" />
              </div>
              <div className="flex flex-wrap gap-2">
                {topic === 'stack' && <>
                  <button onClick={handleStackPush} className="flex-1 py-1.5 text-xs border border-border rounded bg-background hover:border-accent hover:text-accent transition-colors">Push</button>
                  <button onClick={handleStackPop} className="flex-1 py-1.5 text-xs border border-border rounded bg-background hover:border-red-500 hover:text-red-400 transition-colors">Pop</button>
                </>}
                {topic === 'queue' && <>
                  <button onClick={handleEnqueue} className="flex-1 py-1.5 text-xs border border-border rounded bg-background hover:border-accent hover:text-accent transition-colors">Enqueue</button>
                  <button onClick={handleDequeue} className="flex-1 py-1.5 text-xs border border-border rounded bg-background hover:border-red-500 hover:text-red-400 transition-colors">Dequeue</button>
                </>}
                {topic === 'linked-list' && <>
                  <button onClick={handleLLPrepend} className="flex-1 py-1.5 text-xs border border-border rounded bg-background hover:border-accent hover:text-accent transition-colors">Prepend</button>
                  <button onClick={handleLLDelete} className="flex-1 py-1.5 text-xs border border-border rounded bg-background hover:border-red-500 hover:text-red-400 transition-colors">Delete Head</button>
                </>}
                {topic === 'binary-search' && <>
                  <button onClick={() => setBsStep(s => Math.max(0, s - 1))} className="flex-1 py-1.5 text-xs border border-border rounded bg-background hover:border-accent transition-colors flex items-center justify-center gap-1"><ChevronLeft size={12} /> Prev</button>
                  <button onClick={() => setBsStep(s => s + 1)} className="flex-1 py-1.5 text-xs border border-border rounded bg-background hover:border-accent transition-colors flex items-center justify-center gap-1">Next <ChevronRight size={12} /></button>
                </>}
                {(topic === 'array' || topic === 'binary-tree' || topic === 'graph') && (
                  <button onClick={() => setIsPlaying(p => !p)} className="w-full py-1.5 text-xs border border-accent rounded bg-accent/10 text-accent hover:bg-accent/20 transition-colors">
                    {isPlaying ? '⏸ Pause' : '▶ Animate'}
                  </button>
                )}
              </div>
            </div>

            {/* Explanation */}
            <div className="border-t border-border pt-4">
              <div className="text-xs font-bold text-accent uppercase tracking-wider mb-2">{info.title}</div>
              <p className="text-xs text-muted leading-relaxed mb-3">{info.description}</p>
              <div className="space-y-1.5">
                {info.ops.map((op, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-muted">
                    <span className="text-accent mt-0.5 shrink-0">›</span>
                    <span>{op}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Context from chat */}
            {contextMessage && (
              <div className="border-t border-border pt-4">
                <div className="text-xs font-bold text-muted uppercase tracking-wider mb-2">From your chat</div>
                <p className="text-xs text-muted/70 leading-relaxed italic">{contextMessage}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
