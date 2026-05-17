import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Swords, Shield, Sparkles, Users, User,
  Copy, Check, UserPlus, Play, ArrowRight, RefreshCw 
} from 'lucide-react';
import { useCodeBuddyStore } from '../store/useCodeBuddyStore';
import { useUserStore } from '../store/useUserStore';
import { CodeBuddyArena } from '../components/codebuddy/CodeBuddyArena';
import { useCodeBuddySync } from '../hooks/useCodeBuddySync';

export const CodeBuddyPage: React.FC = () => {
  // Activate real-time cross-tab synchronization
  useCodeBuddySync();

  const { user } = useUserStore();

  const { 
    room, 
    createRoom, 
    joinRoom, 
    startMatch, 
    leaveRoom,
    isHost,
    myParticipantId
  } = useCodeBuddyStore();

  const [lobbyTab, setLobbyTab] = useState<'create' | 'join'>('create');
  const [opponentType, setOpponentType] = useState<'bot' | 'friend'>('bot');
  const [timer, setTimer] = useState<number>(30);
  const [mode] = useState<'standard' | 'speed' | 'sudden_death'>('standard');
  const [companion, setCompanion] = useState<'jerry' | 'devbot' | 'coder-x'>('jerry');
  const [problemSource, setProblemSource] = useState<'random' | 'ai'>('random');
  const [topicSlug, setTopicSlug] = useState<string>('arrays');
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState<boolean>(false);

  const handleCopyCode = () => {
    if (!room) return;
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreate = () => {
    const storedProfile = localStorage.getItem('patternlab_profile');
    let displayName = 'Host';
    if (storedProfile) {
      try {
        displayName = JSON.parse(storedProfile).displayName || displayName;
      } catch {}
    }
    if (displayName === 'Host' && user) {
      displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Host';
    }

    createRoom({
      timer,
      mode,
      companion,
      problemSource,
      topicSlug,
      opponentType,
      hostName: displayName
    });
  };

  const handleJoin = async () => {
    setErrorMsg(null);
    if (!joinCodeInput.trim()) {
      setErrorMsg("Please enter a valid room code.");
      return;
    }

    const storedProfile = localStorage.getItem('patternlab_profile');
    let displayName = 'Challenger';
    if (storedProfile) {
      try {
        displayName = JSON.parse(storedProfile).displayName || displayName;
      } catch {}
    }
    if (displayName === 'Challenger' && user) {
      displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Challenger';
    }
    
    setIsJoining(true);
    const success = await joinRoom(joinCodeInput, displayName);
    setIsJoining(false);
    
    if (!success) {
      setErrorMsg("Failed to locate battle room code. Please ensure the Host is active in their lobby waiting room.");
    }
  };

  // If match is active or completed, switch straight to Arena view!
  if (room && (room.status === 'active' || room.status === 'completed')) {
    return <CodeBuddyArena />;
  }

  // Check if a friend has connected in multiplayer
  const hasFriendConnected = room ? room.participants.some(p => p.id === 'friend-user') : false;

  return (
    <div className="min-h-full bg-background text-primary flex flex-col items-center py-6 px-6 overflow-y-auto">
      
      {/* ── Outer Glowing Header ── */}
      <div className="text-center max-w-2xl mb-5">
        <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent mx-auto mb-2 shadow-[0_0_20px_rgba(124,111,247,0.2)] animate-pulse">
          <Swords size={20} />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white">CodeBuddy Arena</h1>
        <p className="text-muted text-xs mt-1 leading-relaxed">
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
            className="w-full max-w-2xl bg-surface border border-border rounded-3xl overflow-hidden shadow-2xl mb-8"
          >
            {/* Mode selection tabs */}
            <div className="flex border-b border-border h-11 bg-background/30 shrink-0">
              <button 
                onClick={() => setLobbyTab('create')}
                className={`flex-1 flex items-center justify-center gap-2 text-xs font-bold transition-all relative ${
                  lobbyTab === 'create' ? 'text-accent' : 'text-muted hover:text-primary'
                }`}
              >
                <Sparkles size={14} /> Create Private Battle
                {lobbyTab === 'create' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />}
              </button>
              <button 
                onClick={() => setLobbyTab('join')}
                className={`flex-1 flex items-center justify-center gap-2 text-xs font-bold transition-all relative ${
                  lobbyTab === 'join' ? 'text-accent' : 'text-muted hover:text-primary'
                }`}
              >
                <UserPlus size={14} /> Join With Code
                {lobbyTab === 'join' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />}
              </button>
            </div>

            <div className="p-5 text-left space-y-4">
              {lobbyTab === 'create' ? (
                /* Create room options */
                <div className="space-y-4">
                  {/* Topic Select */}
                  <div>
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest block mb-1.5 font-mono">1. CURRICULUM TOPIC</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'arrays', label: 'Array & Matrix' },
                        { id: 'strings', label: 'Two-Pointer String' },
                        { id: 'linked_list', label: 'Linked List' }
                      ].map(t => (
                        <button
                          key={t.id}
                          onClick={() => setTopicSlug(t.id)}
                          className={`px-3 py-2 rounded-lg border text-[11px] font-bold text-center transition-all ${
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

                  {/* Opponent Selection (Bot vs Friend) */}
                  <div>
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest block mb-1.5 font-mono">2. CHALLENGE TYPE</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setOpponentType('bot')}
                        className={`px-3 py-2 rounded-lg border text-[11px] font-bold text-left transition-all flex items-center gap-2.5 ${
                          opponentType === 'bot' 
                            ? 'bg-accent/10 border-accent text-accent shadow-[0_0_15px_rgba(124,111,247,0.1)]' 
                            : 'bg-background border-border text-muted hover:border-accent/40'
                        }`}
                      >
                        <User size={13} className="shrink-0" />
                        <div>
                          <div>Challenge Bot Companion</div>
                          <div className="text-[9px] font-normal text-muted/80 mt-0.5">Practice DSA with an offline AI Bot</div>
                        </div>
                      </button>

                      <button
                        onClick={() => setOpponentType('friend')}
                        className={`px-3 py-2 rounded-lg border text-[11px] font-bold text-left transition-all flex items-center gap-2.5 ${
                          opponentType === 'friend' 
                            ? 'bg-violet-500/10 border-violet-500 text-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.1)]' 
                            : 'bg-background border-border text-muted hover:border-accent/40'
                        }`}
                      >
                        <Users size={13} className="shrink-0" />
                        <div>
                          <div>Invite a Friend</div>
                          <div className="text-[9px] font-normal text-muted/80 mt-0.5">Real-time cross-tab PVP battle</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Question Source */}
                  <div>
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest block mb-1.5 font-mono">3. BATTLE PROBLEM ORIGIN</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setProblemSource('random')}
                        className={`px-3 py-2 rounded-lg border text-[11px] font-bold text-left transition-all flex items-center gap-2.5 ${
                          problemSource === 'random' 
                            ? 'bg-accent/10 border-accent text-accent shadow-[0_0_15px_rgba(124,111,247,0.1)]' 
                            : 'bg-background border-border text-muted hover:border-accent/40'
                        }`}
                      >
                        <RefreshCw size={13} className="shrink-0" />
                        <div>
                          <div>Random Topic Question</div>
                          <div className="text-[9px] font-normal text-muted/80 mt-0.5">Selects a curriculum question</div>
                        </div>
                      </button>

                      <button
                        onClick={() => setProblemSource('ai')}
                        className={`px-3 py-2 rounded-lg border text-[11px] font-bold text-left transition-all flex items-center gap-2.5 ${
                          problemSource === 'ai' 
                            ? 'bg-violet-500/10 border-violet-500 text-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.1)]' 
                            : 'bg-background border-border text-muted hover:border-accent/40'
                        }`}
                      >
                        <Sparkles size={13} className="shrink-0" />
                        <div>
                          <div>AI Adaptive Question</div>
                          <div className="text-[9px] font-normal text-muted/80 mt-0.5">Generates original custom problem</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Timers & Companion Selector Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Timer */}
                    <div>
                      <label className="text-[10px] font-black text-muted uppercase tracking-widest block mb-1.5 font-mono">4. TIME LIMIT</label>
                      <div className="flex gap-2">
                        {[15, 30, 45].map(t => (
                          <button
                            key={t}
                            onClick={() => setTimer(t)}
                            className={`flex-1 py-2 rounded-lg border text-[11px] font-mono font-bold transition-all ${
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

                    {/* Opponent Bot or Info notice */}
                    <div>
                      <label className="text-[10px] font-black text-muted uppercase tracking-widest block mb-1.5 font-mono">
                        {opponentType === 'friend' ? '5. PVP INSTRUCTIONS' : '5. BATTLE COMPANION'}
                      </label>
                      
                      {opponentType === 'friend' ? (
                        <div className="bg-background border border-border rounded-lg p-2 text-[10px] text-muted leading-relaxed font-mono">
                          Share your generated Room Code with a friend. Once they join, you can start the match!
                        </div>
                      ) : (
                        <select
                          value={companion}
                          onChange={(e) => setCompanion(e.target.value as any)}
                          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-[11px] font-bold text-primary placeholder:text-muted/50 outline-none focus:border-accent transition-colors"
                        >
                          <option value="jerry">Jerry (Average, O(N) linear strategy)</option>
                          <option value="devbot">Dev-Bot (Advanced AI optimization expert)</option>
                          <option value="coder-x">Coder-X (Hard, fast but unstable correctness)</option>
                        </select>
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={handleCreate}
                    className="w-full py-3 rounded-xl bg-accent hover:bg-accent-hover text-white font-black text-xs shadow-xl shadow-accent/25 flex items-center justify-center gap-2 active:scale-95 transition-all mt-2"
                  >
                    <Play size={13} /> Assemble Private Battle Arena
                  </button>
                </div>
              ) : (
                /* Join room panel */
                <div className="space-y-3 py-2">
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest block font-mono">ENTER PRIVATE ROOM CODE</label>
                  <div className="flex gap-2">
                    <input 
                      value={joinCodeInput}
                      onChange={e => setJoinCodeInput(e.target.value)}
                      placeholder="e.g. CB-8492"
                      className="flex-1 bg-background border border-border rounded-lg px-3.5 py-2.5 text-xs font-mono text-primary placeholder:text-muted/50 outline-none focus:border-accent transition-colors"
                    />
                    <button 
                      onClick={handleJoin}
                      disabled={isJoining}
                      className="px-5 rounded-lg bg-accent hover:bg-accent-hover disabled:bg-muted text-white font-bold text-xs shadow-lg active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
                    >
                      {isJoining ? (
                        <>
                          <span className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin shrink-0" />
                          <span>Connecting...</span>
                        </>
                      ) : (
                        <>
                          <span>Join Arena</span>
                          <ArrowRight size={13} />
                        </>
                      )}
                    </button>
                  </div>

                  {errorMsg && (
                    <div className="flex flex-col gap-1 text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3.5 py-2.5 rounded-lg text-left">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Shield size={12} />
                        <span>Room Connection Error</span>
                      </div>
                      <p className="opacity-95 leading-normal mt-0.5">{errorMsg}</p>
                      <div className="mt-1.5 border-t border-rose-500/15 pt-1.5 text-[10px] text-muted leading-relaxed font-mono">
                        <span className="font-bold text-accent">Tip:</span> Locally, browser tabs must share the <span className="text-white font-bold">exact same port origin</span> (e.g. both on <code className="text-accent bg-white/5 px-1 rounded font-bold font-mono">5173</code>) to share local storage. Different ports (like 5173 and 5174) are blocked by browser Same-Origin security policies.
                      </div>
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
            className="w-full max-w-xl bg-surface border border-border rounded-3xl p-6 shadow-2xl relative overflow-hidden text-center mb-8"
          >
            {/* Glowing invite code */}
            <div className="text-[9px] font-black text-muted uppercase tracking-widest font-mono mb-1.5">SHARE BATTLE INVITE</div>
            <div className="flex items-center justify-center gap-2.5 bg-background border border-border px-5 py-2 rounded-xl max-w-[200px] mx-auto mb-5 relative">
              <span className="font-mono font-black text-white text-lg tracking-widest">{room.code}</span>
              <button 
                onClick={handleCopyCode}
                className="p-1.5 rounded-lg text-muted hover:text-white hover:bg-white/5 transition-all"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
            </div>

            <div className="space-y-2.5 mb-5 text-left">
              <h3 className="text-[10px] font-black text-white uppercase tracking-widest font-mono mb-1.5">ARENA PARTICIPANTS</h3>
              
              {room.participants.map(p => (
                <div key={p.id} className="bg-background border border-border p-2.5 rounded-xl flex items-center justify-between text-left animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center gap-2.5">
                    <img src={p.avatarUrl} alt="" className="w-8 h-8 rounded-lg bg-white/5 p-1 shrink-0" />
                    <div>
                      <div className="text-[11px] font-bold text-white">
                        {p.name}{p.id === myParticipantId ? ' (You)' : ''}
                      </div>
                      <div className="text-[9px] text-muted mt-0.5 font-mono">
                        {p.id === 'host-user' || p.id === 'user' ? 'Lobby Host' : room.opponentType === 'bot' ? 'Challenger Bot' : 'Friend Challenger'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[9px] font-bold text-emerald-400 font-mono uppercase tracking-wider">Ready</span>
                  </div>
                </div>
              ))}

              {room.opponentType === 'friend' && !hasFriendConnected && (
                <div className="bg-background/40 border border-dashed border-border p-4 rounded-xl flex flex-col items-center justify-center text-center space-y-1">
                  <div className="w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center animate-pulse">
                    <Users size={12} />
                  </div>
                  <div className="text-[11px] font-bold text-white">Awaiting Challenger...</div>
                  <div className="text-[9px] text-muted max-w-xs leading-normal">
                    Share Room Code <span className="font-mono text-white font-bold">{room.code}</span> with your friend.
                  </div>
                </div>
              )}
            </div>

            {/* Actions depending on role */}
            <div className="flex gap-3">
              <button 
                onClick={leaveRoom}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 font-bold text-[11px] text-white transition-all active:scale-95"
              >
                {isHost ? "Dissolve Room" : "Leave Lobby"}
              </button>

              {isHost ? (
                <button 
                  onClick={startMatch}
                  disabled={room.opponentType === 'friend' && !hasFriendConnected}
                  className={`flex-1 py-2.5 rounded-xl font-black text-[11px] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
                    room.opponentType === 'friend' && !hasFriendConnected
                      ? "bg-muted border border-border text-muted cursor-not-allowed"
                      : "bg-accent hover:bg-accent-hover text-white shadow-accent/25 animate-pulse"
                  }`}
                >
                  <Play size={12} /> 
                  {room.opponentType === 'friend' && !hasFriendConnected
                    ? "Waiting for Friend..."
                    : "Initialize Battle Arena"
                  }
                </button>
              ) : (
                <div className="flex-1 py-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[11px] font-bold flex items-center justify-center gap-1.5 animate-pulse font-mono">
                  <span className="w-1 h-1 rounded-full bg-violet-400 animate-ping" />
                  Awaiting Host to start...
                </div>
              )}
            </div>

            {/* Ambient glows */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-accent/5 rounded-full blur-[60px] pointer-events-none" />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
