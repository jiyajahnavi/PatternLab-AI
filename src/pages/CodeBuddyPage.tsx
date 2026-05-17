import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Swords, Shield, Sparkles, 
  Copy, Check, UserPlus, Play, ArrowRight, RefreshCw 
} from 'lucide-react';
import { useCodeBuddyStore } from '../store/useCodeBuddyStore';
import { CodeBuddyArena } from '../components/codebuddy/CodeBuddyArena';

export const CodeBuddyPage: React.FC = () => {
  const { 
    room, 
    createRoom, 
    joinRoom, 
    startMatch, 
    leaveRoom 
  } = useCodeBuddyStore();

  const [lobbyTab, setLobbyTab] = useState<'create' | 'join'>('create');
  const [timer, setTimer] = useState<number>(30);
  const [mode] = useState<'standard' | 'speed' | 'sudden_death'>('standard');
  const [companion, setCompanion] = useState<'jerry' | 'devbot' | 'coder-x'>('jerry');
  const [problemSource, setProblemSource] = useState<'specific' | 'random' | 'ai'>('random');
  const [topicSlug, setTopicSlug] = useState<string>('arrays');
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCopyCode = () => {
    if (!room) return;
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreate = () => {
    createRoom({
      timer,
      mode,
      companion,
      problemSource,
      topicSlug
    });
  };

  const handleJoin = () => {
    setErrorMsg(null);
    if (!joinCodeInput.trim()) {
      setErrorMsg("Please enter a valid room code.");
      return;
    }
    const success = joinRoom(joinCodeInput);
    if (!success) {
      setErrorMsg("Failed to locate battle room code. Please check and try again.");
    }
  };

  // If match is active or completed, switch straight to Arena view!
  if (room && (room.status === 'active' || room.status === 'completed')) {
    return <CodeBuddyArena />;
  }

  return (
    <div className="h-full overflow-y-auto bg-background text-primary flex flex-col items-center py-10 px-6">
      
      {/* ── Outer Glowing Header ── */}
      <div className="text-center max-w-2xl mb-12">
        <div className="w-14 h-14 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent mx-auto mb-4 shadow-[0_0_30px_rgba(124,111,247,0.25)] animate-pulse">
          <Swords size={28} />
        </div>
        <h1 className="text-4xl font-black tracking-tight text-white">CodeBuddy Arena</h1>
        <p className="text-muted text-sm mt-2 leading-relaxed">
          Real-time collaborative competitive coding. Form private practice rooms, challenge companions under timer constraints, and get evaluated by AI.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!room ? (
          /* ═══════════════════════════════════════
             ══ 🎮 LOBBY SELECTION & CREATION 🎮 ══
             ═══════════════════════════════════════ */
          <motion.div 
            key="lobby-selection"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-2xl bg-surface border border-border rounded-3xl overflow-hidden shadow-2xl"
          >
            {/* Mode selection tabs */}
            <div className="flex border-b border-border h-12 bg-background/30 shrink-0">
              <button 
                onClick={() => setLobbyTab('create')}
                className={`flex-1 flex items-center justify-center gap-2 text-sm font-bold transition-all relative ${
                  lobbyTab === 'create' ? 'text-accent' : 'text-muted hover:text-primary'
                }`}
              >
                <Sparkles size={16} /> Create Private Battle
                {lobbyTab === 'create' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />}
              </button>
              <button 
                onClick={() => setLobbyTab('join')}
                className={`flex-1 flex items-center justify-center gap-2 text-sm font-bold transition-all relative ${
                  lobbyTab === 'join' ? 'text-accent' : 'text-muted hover:text-primary'
                }`}
              >
                <UserPlus size={16} /> Join With Code
                {lobbyTab === 'join' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />}
              </button>
            </div>

            <div className="p-8 text-left space-y-6">
              {lobbyTab === 'create' ? (
                /* Create room options */
                <div className="space-y-6">
                  {/* Topic Select */}
                  <div>
                    <label className="text-xs font-black text-muted uppercase tracking-widest block mb-2 font-mono">1. CURRICULUM TOPIC</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'arrays', label: 'Array & Matrix' },
                        { id: 'strings', label: 'Two-Pointer String' },
                        { id: 'linked_list', label: 'Linked List' }
                      ].map(t => (
                        <button
                          key={t.id}
                          onClick={() => setTopicSlug(t.id)}
                          className={`px-4 py-3 rounded-xl border text-xs font-bold text-center transition-all ${
                            topicSlug === t.id 
                              ? 'bg-accent/10 border-accent text-accent shadow-[0_0_15px_rgba(124,111,247,0.1)]' 
                              : 'bg-background border-border text-muted hover:border-accent/40'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Question Source */}
                  <div>
                    <label className="text-xs font-black text-muted uppercase tracking-widest block mb-2 font-mono">2. BATTLE PROBLEM ORIGIN</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setProblemSource('random')}
                        className={`px-4 py-3 rounded-xl border text-xs font-bold text-left transition-all flex items-center gap-3 ${
                          problemSource === 'random' 
                            ? 'bg-accent/10 border-accent text-accent shadow-[0_0_15px_rgba(124,111,247,0.1)]' 
                            : 'bg-background border-border text-muted hover:border-accent/40'
                        }`}
                      >
                        <RefreshCw size={15} />
                        <div>
                          <div>Random Topic Question</div>
                          <div className="text-[10px] font-normal text-muted/80 mt-0.5">Selects a curriculum question</div>
                        </div>
                      </button>

                      <button
                        onClick={() => setProblemSource('ai')}
                        className={`px-4 py-3 rounded-xl border text-xs font-bold text-left transition-all flex items-center gap-3 ${
                          problemSource === 'ai' 
                            ? 'bg-violet-500/10 border-violet-500 text-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.1)]' 
                            : 'bg-background border-border text-muted hover:border-accent/40'
                        }`}
                      >
                        <Sparkles size={15} />
                        <div>
                          <div>AI Adaptive Question</div>
                          <div className="text-[10px] font-normal text-muted/80 mt-0.5">Generates original custom problem</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Timers & Bots Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Timer */}
                    <div>
                      <label className="text-xs font-black text-muted uppercase tracking-widest block mb-2 font-mono">3. TIME LIMIT</label>
                      <div className="flex gap-2">
                        {[15, 30, 45].map(t => (
                          <button
                            key={t}
                            onClick={() => setTimer(t)}
                            className={`flex-1 py-2.5 rounded-xl border text-xs font-mono font-bold transition-all ${
                              timer === t 
                                ? 'bg-accent border-accent text-white shadow-lg shadow-accent/20' 
                                : 'bg-background border-border text-muted hover:border-accent/40'
                            }`}
                          >
                            {t} MIN
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Opponent Bot */}
                    <div>
                      <label className="text-xs font-black text-muted uppercase tracking-widest block mb-2 font-mono">4. BATTLE COMPANION</label>
                      <select
                        value={companion}
                        onChange={(e) => setCompanion(e.target.value as any)}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-xs font-bold text-primary placeholder:text-muted/50 outline-none focus:border-accent transition-colors"
                      >
                        <option value="jerry">Jerry (Average, O(N) linear strategy)</option>
                        <option value="devbot">Dev-Bot (Advanced AI optimization expert)</option>
                        <option value="coder-x">Coder-X (Hard, fast but unstable correctness)</option>
                      </select>
                    </div>
                  </div>

                  <button 
                    onClick={handleCreate}
                    className="w-full py-4 rounded-2xl bg-accent hover:bg-accent-hover text-white font-black text-sm shadow-xl shadow-accent/25 flex items-center justify-center gap-2 active:scale-95 transition-all mt-4"
                  >
                    <Play size={16} /> Assemble Private Battle Arena
                  </button>
                </div>
              ) : (
                /* Join room panel */
                <div className="space-y-4 py-4">
                  <label className="text-xs font-black text-muted uppercase tracking-widest block font-mono">ENTER PRIVATE ROOM CODE</label>
                  <div className="flex gap-3">
                    <input 
                      value={joinCodeInput}
                      onChange={e => setJoinCodeInput(e.target.value)}
                      placeholder="e.g. CB-8492"
                      className="flex-1 bg-background border border-border rounded-xl px-4 py-3.5 text-sm font-mono text-primary placeholder:text-muted/50 outline-none focus:border-accent transition-colors"
                    />
                    <button 
                      onClick={handleJoin}
                      className="px-6 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold text-sm shadow-lg active:scale-95 transition-all flex items-center gap-2"
                    >
                      Join Arena <ArrowRight size={16} />
                    </button>
                  </div>

                  {errorMsg && (
                    <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-4 py-3 rounded-xl">
                      <Shield size={14} />
                      {errorMsg}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          /* ════════════════════════════════════
             ══ ⏳ PRIVATE WAITING LOBBY ⏳ ══
             ════════════════════════════════════ */
          <motion.div 
            key="waiting-lobby"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-xl bg-surface border border-border rounded-3xl p-8 shadow-2xl relative overflow-hidden text-center"
          >
            {/* Glowing invite code */}
            <div className="text-[10px] font-black text-muted uppercase tracking-widest font-mono mb-2">SHARE BATTLE INVITE</div>
            <div className="flex items-center justify-center gap-3 bg-background border border-border px-6 py-3 rounded-2xl max-w-xs mx-auto mb-8 relative">
              <span className="font-mono font-black text-white text-xl tracking-widest">{room.code}</span>
              <button 
                onClick={handleCopyCode}
                className="p-2 -mr-2 rounded-xl text-muted hover:text-white hover:bg-white/5 transition-all"
              >
                {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
              </button>
            </div>

            <div className="space-y-4 mb-8">
              <h3 className="text-sm font-black text-white uppercase tracking-widest font-mono text-left mb-2">ARENA PARTICIPANTS</h3>
              
              {room.participants.map(p => (
                <div key={p.id} className="bg-background border border-border p-4 rounded-2xl flex items-center justify-between text-left">
                  <div className="flex items-center gap-3">
                    <img src={p.avatarUrl} alt="" className="w-10 h-10 rounded-xl bg-white/5 p-1 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-white">{p.name}</div>
                      <div className="text-[10px] text-muted mt-0.5 font-mono">{p.id === 'user' ? 'Lobby Host' : 'Challenger Bot'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-bold text-emerald-400 font-mono uppercase tracking-wider">Ready</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button 
                onClick={leaveRoom}
                className="flex-1 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 font-bold text-xs text-white transition-all active:scale-95"
              >
                Dissolve Room
              </button>
              <button 
                onClick={startMatch}
                className="flex-1 py-3.5 rounded-2xl bg-accent hover:bg-accent-hover text-white font-black text-xs shadow-xl shadow-accent/20 flex items-center justify-center gap-2 transition-all active:scale-95 animate-pulse"
              >
                <Play size={14} /> Initialize Battle Arena
              </button>
            </div>

            {/* Ambient glows */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-accent/5 rounded-full blur-[80px] pointer-events-none" />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
