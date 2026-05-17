import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { 
  Trophy, Clock, Play, Send, ChevronLeft, 
  Eye, FileText 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCodeBuddyStore } from '../../store/useCodeBuddyStore';

export const CodeBuddyArena: React.FC = () => {
  const { 
    room, 
    timeRemaining, 
    tickTimer, 
    submitUserSolution, 
    simulateOpponentProgress,
    leaveRoom 
  } = useCodeBuddyStore();

  const [code, setCode] = useState<string>('# Write your competitive solution here\n\n');
  const [language, setLanguage] = useState<string>('python');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [attempts, setAttempts] = useState<number>(1);
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [testLog, setTestLog] = useState<string | null>(null);
  const [testCasesPassed, setTestCasesPassed] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'problem' | 'hints'>('problem');
  const [comparisonTab, setComparisonTab] = useState<'summary' | 'codes'>('summary');

  if (!room || !room.problem) return null;

  const { problem, participants, gameMode, timerDuration } = room;
  const userParticipant = participants.find(p => p.id === 'user')!;
  const botParticipant = participants.find(p => p.id !== 'user')!;

  // 1. Start timer tick
  useEffect(() => {
    if (room.status !== 'active') return;
    const interval = setInterval(() => {
      tickTimer();
    }, 1000);
    return () => clearInterval(interval);
  }, [room.status, tickTimer]);

  // 2. Simulate opponent progress halfway through
  useEffect(() => {
    if (room.status !== 'active') return;
    const delay = Math.round((timerDuration * 0.15) * 1000); // Trigger progress after 15% of total time
    const timeout = setTimeout(() => {
      simulateOpponentProgress();
    }, delay);
    return () => clearTimeout(timeout);
  }, [room.status, timerDuration, simulateOpponentProgress]);

  // 3. Trigger confetti on completion if user wins
  useEffect(() => {
    if (room.status === 'completed' && room.winnerId === 'user') {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#7C6FF7', '#10B981', '#3B82F6']
      });
    }
  }, [room.status, room.winnerId]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setTestLog("Running compilation tests...");
    setAttempts(a => a + 1);
    
    // Simulate test execution
    setTimeout(() => {
      setTestLog("✓ Initial local compiler tests passed.\nAll basic assertions matching expected outputs.");
      setTestCasesPassed(true);
      setIsRunning(false);
    }, 1500);
  };

  const handleSubmitCode = async () => {
    setIsSubmitting(true);
    setTestLog("Submitting solution to AI Evaluator & compiler...");
    
    setTimeout(() => {
      const elapsed = timerDuration - timeRemaining;
      submitUserSolution(code, elapsed, attempts, hintsUsed, testCasesPassed);
      setIsSubmitting(false);
    }, 2000);
  };

  return (
    <div className="h-full flex flex-col bg-background text-primary">
      {/* ── TOP BAR (Arena Header) ── */}
      <div className="h-14 bg-surface border-b border-border flex items-center justify-between px-6 shrink-0 z-10 relative">
        <div className="flex items-center gap-3">
          <button 
            onClick={leaveRoom} 
            className="p-2 -ml-2 rounded-xl text-muted hover:text-white hover:bg-white/5 transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          <div>
            <div className="text-[10px] font-bold text-accent uppercase tracking-widest font-mono">BATTLE ARENA</div>
            <div className="text-sm font-black text-white">{problem.title}</div>
          </div>
        </div>

        {/* Sync Timer widget */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-1.5 rounded-full bg-accent/10 border border-accent/20 shadow-[0_0_20px_rgba(124,111,247,0.15)]">
          <Clock size={16} className="text-accent animate-pulse" />
          <span className="font-mono font-black text-white tracking-widest text-base">
            {room.status === 'completed' ? 'MATCH ENDED' : formatTime(timeRemaining)}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            disabled={room.status === 'completed'}
            className="bg-background border border-border rounded-xl px-3 py-1.5 outline-none text-xs text-primary font-mono capitalize hover:border-accent transition-all cursor-pointer"
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
          </select>
        </div>
      </div>

      {room.status === 'completed' ? (
        /* ═════════════════════════════════════════
           ══ 🏆 COMPARISON & SCORECARD SCREEN 🏆 ══
           ═════════════════════════════════════════ */
        <div className="flex-1 overflow-y-auto p-8 space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-300 max-w-7xl mx-auto w-full">
          
          {/* Champion Banner */}
          <div className={`p-8 rounded-3xl border relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 ${
            room.winnerId === 'user'
              ? 'bg-emerald-500/[0.03] border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.06)]'
              : 'bg-rose-500/[0.03] border-rose-500/20 shadow-[0_0_50px_rgba(244,63,94,0.06)]'
          }`}>
            <div className="flex items-center gap-6 z-10 text-center md:text-left flex-col md:flex-row">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${
                room.winnerId === 'user' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              }`}>
                <Trophy size={42} strokeWidth={2} className={room.winnerId === 'user' ? 'animate-bounce' : ''} />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-white">
                  {room.winnerId === 'user' ? 'Battle Victory!' : `${botParticipant.name} Wins!`}
                </h1>
                <p className="text-sm text-muted mt-1 max-w-[480px]">
                  {room.winnerId === 'user' 
                    ? 'Excellent job! You successfully out-optimized your opponent and earned +25 CodeBuddy Battle Points!'
                    : 'A tough battle. Your opponent demonstrated superior optimization and speed. Learn from their solution below!'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 z-10">
              <div className="px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                <div className="text-[10px] font-black text-muted uppercase tracking-widest font-mono">BATTLE POINTS</div>
                <div className="text-2xl font-black text-white font-mono">{room.winnerId === 'user' ? '+25' : '+0'}</div>
              </div>
              <button 
                onClick={leaveRoom}
                className="px-6 py-4 rounded-2xl bg-accent hover:bg-accent-hover text-white font-bold text-sm shadow-lg active:scale-95 transition-all"
              >
                Back to Lobby
              </button>
            </div>

            {/* Ambient glows */}
            <div className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-[100px] pointer-events-none ${
              room.winnerId === 'user' ? 'bg-emerald-500/10' : 'bg-rose-500/10'
            }`} />
          </div>

          {/* Tab Selector */}
          <div className="flex border-b border-border gap-6">
            <button 
              onClick={() => setComparisonTab('summary')}
              className={`flex items-center gap-2 py-4 px-1 text-sm font-bold transition-all relative ${
                comparisonTab === 'summary' ? 'text-accent' : 'text-muted hover:text-primary'
              }`}
            >
              <FileText size={16} /> Comparative Summary
              {comparisonTab === 'summary' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />}
            </button>
            <button 
              onClick={() => setComparisonTab('codes')}
              className={`flex items-center gap-2 py-4 px-1 text-sm font-bold transition-all relative ${
                comparisonTab === 'codes' ? 'text-accent' : 'text-muted hover:text-primary'
              }`}
            >
              <Eye size={16} /> Side-by-Side Code Comparison
              {comparisonTab === 'codes' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />}
            </button>
          </div>

          {comparisonTab === 'summary' ? (
            /* ══ COMPARATIVE SUMMARY PANEL ══ */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Detailed Scorecards */}
              <div className="lg:col-span-8 space-y-6">
                <div className="bg-surface border border-border rounded-3xl p-6">
                  <h3 className="text-lg font-black text-white mb-6">Weighted Performance Analysis</h3>
                  
                  <div className="space-y-8">
                    {/* User Scorecard */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <img src={userParticipant.avatarUrl} alt="" className="w-8 h-8 rounded-lg bg-white/5 p-1" />
                          <span className="font-bold text-white text-sm">You (PatternLab Student)</span>
                        </div>
                        <span className="font-mono font-black text-emerald-400 text-lg">{userParticipant.score}/100</span>
                      </div>
                      <div className="grid grid-cols-5 gap-3">
                        {[
                          { label: 'Correctness', weight: '40%', val: userParticipant.correctness },
                          { label: 'Complexity', weight: '25%', val: userParticipant.complexityScore },
                          { label: 'Solve Speed', weight: '15%', val: userParticipant.speedScore },
                          { label: 'Code Quality', weight: '10%', val: userParticipant.qualityScore },
                          { label: 'Hint Score', weight: '10%', val: userParticipant.hintScore },
                        ].map(c => (
                          <div key={c.label} className="bg-background border border-border rounded-xl p-3 text-center">
                            <div className="text-[9px] font-bold text-muted uppercase tracking-wider">{c.label}</div>
                            <div className="text-[10px] text-muted/50 font-mono mt-0.5">wt: {c.weight}</div>
                            <div className="text-sm font-black text-white font-mono mt-1">{c.val}%</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-border" />

                    {/* Companion Scorecard */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <img src={botParticipant.avatarUrl} alt="" className="w-8 h-8 rounded-lg bg-white/5 p-1" />
                          <span className="font-bold text-white text-sm">{botParticipant.name} (Opponent)</span>
                        </div>
                        <span className="font-mono font-black text-accent text-lg">{botParticipant.score}/100</span>
                      </div>
                      <div className="grid grid-cols-5 gap-3">
                        {[
                          { label: 'Correctness', weight: '40%', val: botParticipant.correctness },
                          { label: 'Complexity', weight: '25%', val: botParticipant.complexityScore },
                          { label: 'Solve Speed', weight: '15%', val: botParticipant.speedScore },
                          { label: 'Code Quality', weight: '10%', val: botParticipant.qualityScore },
                          { label: 'Hint Score', weight: '10%', val: botParticipant.hintScore },
                        ].map(c => (
                          <div key={c.label} className="bg-background border border-border rounded-xl p-3 text-center">
                            <div className="text-[9px] font-bold text-muted uppercase tracking-wider">{c.label}</div>
                            <div className="text-[10px] text-muted/50 font-mono mt-0.5">wt: {c.weight}</div>
                            <div className="text-sm font-black text-white font-mono mt-1">{c.val}%</div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>

                {/* AI Review Summary */}
                <div className="bg-surface border border-border rounded-3xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                      <Trophy size={16} />
                    </div>
                    <h3 className="text-lg font-black text-white">Comparative Intelligence Report</h3>
                  </div>
                  <div className="bg-background border border-border rounded-2xl p-5 text-sm leading-relaxed text-muted font-mono whitespace-pre-line">
                    {room.comparisonFeedback}
                  </div>
                </div>
              </div>

              {/* Sidebar Quick Stats */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-surface border border-border rounded-3xl p-6">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 font-mono">MATCH METRICS</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-background border border-border p-3.5 rounded-xl text-sm">
                      <span className="text-muted">Total Time Limit</span>
                      <span className="font-black text-white font-mono">{timerDuration / 60} mins</span>
                    </div>
                    <div className="flex justify-between items-center bg-background border border-border p-3.5 rounded-xl text-sm">
                      <span className="text-muted">Your Solve Duration</span>
                      <span className="font-black text-white font-mono">{formatTime(userParticipant.solvedTime || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center bg-background border border-border p-3.5 rounded-xl text-sm">
                      <span className="text-muted">Opponent Solve Duration</span>
                      <span className="font-black text-white font-mono">{formatTime(botParticipant.solvedTime || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center bg-background border border-border p-3.5 rounded-xl text-sm">
                      <span className="text-muted">Your attempts</span>
                      <span className="font-black text-white font-mono">{userParticipant.attempts}</span>
                    </div>
                    <div className="flex justify-between items-center bg-background border border-border p-3.5 rounded-xl text-sm">
                      <span className="text-muted">Hints revealed</span>
                      <span className="font-black text-white font-mono">{userParticipant.hintsUsed}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            /* ══ SIDE-BY-SIDE CODES COMPARISON PANEL ══ */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[520px]">
              
              {/* User Code Container */}
              <div className="flex flex-col bg-surface border border-border rounded-3xl overflow-hidden">
                <div className="px-5 py-4 border-b border-border bg-background/50 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-sm font-bold text-white">Your solution</span>
                  </div>
                  <span className="text-xs font-mono text-muted">{userParticipant.complexity}</span>
                </div>
                <div className="flex-1 min-h-0 text-left">
                  <Editor
                    height="100%"
                    language="python"
                    theme="vs-dark"
                    value={userParticipant.code || code}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      fontSize: 13,
                      fontFamily: 'JetBrains Mono',
                      scrollBeyondLastLine: false,
                      padding: { top: 12 },
                    }}
                  />
                </div>
              </div>

              {/* Bot Code Container */}
              <div className="flex flex-col bg-surface border border-border rounded-3xl overflow-hidden">
                <div className="px-5 py-4 border-b border-border bg-background/50 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
                    <span className="text-sm font-bold text-white">{botParticipant.name}'s strategy</span>
                  </div>
                  <span className="text-xs font-mono text-accent">{botParticipant.complexity}</span>
                </div>
                <div className="flex-1 min-h-0 text-left">
                  <Editor
                    height="100%"
                    language="python"
                    theme="vs-dark"
                    value={botParticipant.code}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      fontSize: 13,
                      fontFamily: 'JetBrains Mono',
                      scrollBeyondLastLine: false,
                      padding: { top: 12 },
                    }}
                  />
                </div>
              </div>

            </div>
          )}

        </div>
      ) : (
        /* ═════════════════════════════════════
           ══ ⚔️ LIVE CODING BATTLE ARENA ⚔️ ══
           ═════════════════════════════════════ */
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT COLUMN: Problem panel / instructions */}
          <div className="w-[35%] border-r border-border bg-surface shrink-0 flex flex-col overflow-hidden">
            {/* Inner Tabs */}
            <div className="flex border-b border-border h-10 shrink-0">
              <button 
                onClick={() => setActiveTab('problem')}
                className={`flex-1 flex items-center justify-center text-xs font-bold transition-all relative ${
                  activeTab === 'problem' ? 'text-accent' : 'text-muted hover:text-primary'
                }`}
              >
                Problem statement
                {activeTab === 'problem' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />}
              </button>
              <button 
                onClick={() => setActiveTab('hints')}
                className={`flex-1 flex items-center justify-center text-xs font-bold transition-all relative ${
                  activeTab === 'hints' ? 'text-accent' : 'text-muted hover:text-primary'
                }`}
              >
                Hints & Hints Used ({hintsUsed})
                {activeTab === 'hints' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6 text-left shrink-0">
              {activeTab === 'problem' ? (
                <>
                  <div className="space-y-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      problem.level === 1 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                      problem.level === 2 ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                      'bg-rose-500/10 text-rose-500 border-rose-500/20'
                    }`}>
                      {problem.level === 1 ? 'Easy' : problem.level === 2 ? 'Medium' : 'Hard'}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-muted ml-3 uppercase tracking-wider">
                      Pattern: {problem.pattern}
                    </span>
                  </div>

                  <div className="prose prose-invert text-sm max-w-none text-muted leading-relaxed whitespace-pre-wrap">
                    {problem.description}
                  </div>

                  {/* Examples */}
                  {problem.examples && problem.examples.map((ex, idx) => (
                    <div key={idx} className="bg-background border border-border p-4 rounded-xl space-y-1.5 font-mono text-xs">
                      <div className="font-bold text-white">Example {idx + 1}:</div>
                      <div><span className="text-muted">Input:</span> {ex.input}</div>
                      <div><span className="text-muted">Output:</span> {ex.output}</div>
                      {ex.explanation && <div><span className="text-muted">Explanation:</span> {ex.explanation}</div>}
                    </div>
                  ))}

                  {/* Constraints */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-white uppercase tracking-widest font-mono">Constraints:</div>
                    <ul className="list-disc pl-4 text-xs text-muted space-y-1 font-mono">
                      {problem.constraints && problem.constraints.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                /* Hints View */
                <div className="space-y-4 pt-2">
                  <p className="text-xs text-muted">Reveal clues if you are stuck. Utilizing hints will slightly reduce your final hint weighted evaluation score.</p>
                  
                  <div className="space-y-3">
                    {problem.hints.slice(0, hintsUsed).map((hint, idx) => (
                      <div key={idx} className="bg-background border border-border p-4 rounded-xl text-xs text-muted leading-relaxed">
                        <span className="font-bold text-accent font-mono block mb-1">Clue {idx + 1}</span>
                        {hint}
                      </div>
                    ))}
                  </div>

                  {hintsUsed < problem.hints.length && (
                    <button 
                      onClick={() => setHintsUsed(h => h + 1)}
                      className="w-full py-2.5 rounded-xl border border-dashed border-accent/30 hover:border-accent/60 bg-accent/5 hover:bg-accent/10 transition-all font-bold text-xs text-accent text-center"
                    >
                      Reveal Clue {hintsUsed + 1}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* MIDDLE COLUMN: Monaco Code Editor */}
          <div className="flex-1 flex flex-col overflow-hidden relative">
            <div className="flex-1 min-h-0 text-left">
              <Editor
                height="100%"
                language={language}
                theme="vs-dark"
                value={code}
                onChange={(val) => setCode(val || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  fontFamily: 'JetBrains Mono',
                  scrollBeyondLastLine: false,
                  padding: { top: 16 },
                  smoothScrolling: true,
                }}
              />
            </div>

            {/* Test Case Log Terminal Overlay */}
            {testLog && (
              <div className="h-36 bg-background border-t border-border px-5 py-4 overflow-y-auto font-mono text-xs text-muted shrink-0 text-left relative z-20">
                <button 
                  onClick={() => setTestLog(null)}
                  className="absolute top-2 right-4 text-[10px] uppercase font-bold text-muted hover:text-white transition-colors"
                >
                  Clear Logs
                </button>
                <div className="text-white font-bold mb-1">Compiler Output:</div>
                <div className="whitespace-pre-line">{testLog}</div>
              </div>
            )}

            {/* Action Bar Footer */}
            <div className="h-14 bg-surface border-t border-border flex items-center justify-between px-6 shrink-0 relative z-30">
              <button 
                onClick={handleRunCode}
                disabled={isRunning || isSubmitting}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-background border border-border hover:border-accent/40 text-xs font-bold text-primary transition-all disabled:opacity-50"
              >
                <Play size={12} className={isRunning ? 'animate-spin' : ''} /> Run Tests
              </button>

              <button 
                onClick={handleSubmitCode}
                disabled={isRunning || isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-xs font-black text-white shadow-lg shadow-accent/20 transition-all disabled:opacity-50 active:scale-95"
              >
                <Send size={12} className={isSubmitting ? 'animate-spin animate-bounce' : ''} /> Submit Solution
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Real-Time Battle presence HUD */}
          <div className="w-64 border-l border-border bg-surface shrink-0 p-5 flex flex-col gap-6 overflow-y-auto">
            
            {/* User card status */}
            <div>
              <h4 className="text-[10px] font-bold text-muted uppercase tracking-widest font-mono mb-3">YOUR STATUS</h4>
              <div className="bg-background border border-border rounded-2xl p-4 flex items-center gap-3">
                <img src={userParticipant.avatarUrl} alt="" className="w-9 h-9 rounded-xl bg-white/5 p-1 shrink-0" />
                <div className="min-w-0 flex-1 text-left">
                  <div className="text-xs font-bold text-white truncate">You</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-emerald-400 uppercase font-mono tracking-wider font-bold">Coding</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Competitor status card */}
            <div>
              <h4 className="text-[10px] font-bold text-muted uppercase tracking-widest font-mono mb-3">COMPETITOR</h4>
              <div className="bg-background border border-border rounded-2xl p-4 flex items-center gap-3">
                <img src={botParticipant.avatarUrl} alt="" className="w-9 h-9 rounded-xl bg-white/5 p-1 shrink-0 animate-pulse" />
                <div className="min-w-0 flex-1 text-left">
                  <div className="text-xs font-bold text-white truncate">{botParticipant.name}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      botParticipant.status === 'submitting' ? 'bg-amber-400 animate-bounce' : 'bg-blue-400 animate-pulse'
                    }`} />
                    <span className={`text-[10px] uppercase font-mono tracking-wider font-bold ${
                      botParticipant.status === 'submitting' ? 'text-amber-400' : 'text-blue-400'
                    }`}>
                      {botParticipant.status === 'submitting' ? 'Checking' : 'Coding'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Match Rules summary */}
            <div className="border-t border-border pt-4">
              <h4 className="text-[10px] font-bold text-muted uppercase tracking-widest font-mono mb-3">RULES & SPECS</h4>
              <div className="space-y-3 font-mono text-[10px] text-muted text-left">
                <div className="flex justify-between items-center">
                  <span>Game Mode</span>
                  <span className="text-white capitalize">{gameMode}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Sudden Death</span>
                  <span className="text-white">Disabled</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Evaluator</span>
                  <span className="text-accent font-bold">AI Brain</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
};
