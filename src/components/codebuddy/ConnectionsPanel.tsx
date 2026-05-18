import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, UserPlus, Copy, Check, Trophy, 
  Sparkles, Send, UserCheck, UserX, Eye, 
  Swords, Settings, ShieldAlert, Activity
} from 'lucide-react';
import { useConnectionsStore, type Connection } from '../../store/useConnectionsStore';
import { useCodeBuddyStore } from '../../store/useCodeBuddyStore';
import { useUserStore } from '../../store/useUserStore';
import { ConnectionProfileView } from './ConnectionProfileView';
import { ProfileComparer } from './ProfileComparer';

export const ConnectionsPanel: React.FC = () => {
  const { user } = useUserStore();
  const { 
    connections, 
    pendingRequests, 
    activities, 
    privacySettings, 
    inviteUsername,
    initializeUsername, 
    sendRequest, 
    acceptRequest, 
    rejectRequest, 
    updatePrivacySettings,
    subscribeToSync
  } = useConnectionsStore();

  const { createRoom } = useCodeBuddyStore();

  // Initialize unique username on mount if not set yet
  useEffect(() => {
    const userEmail = user?.email || 'dev_guest';
    const profileName = localStorage.getItem('patternlab_profile')
      ? JSON.parse(localStorage.getItem('patternlab_profile')!).displayName
      : '';
    initializeUsername(profileName || userEmail);
  }, [user, initializeUsername]);

  // Subscribe to live connection updates / broadcasts via Supabase Realtime
  useEffect(() => {
    const unsubscribe = subscribeToSync();
    return () => unsubscribe();
  }, [subscribeToSync]);

  const [copied, setCopied] = useState(false);
  const [targetUsername, setTargetUsername] = useState('');
  const [requestStatus, setRequestStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);

  // Sub-screens
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [comparingConnection, setComparingConnection] = useState<Connection | null>(null);

  const inviteLink = `${window.location.origin}/connect/${inviteUsername || 'developer'}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUsername.trim()) return;
    
    setRequestStatus('sending');
    setErrorMsg('');

    const cleanName = targetUsername.toLowerCase().trim();
    if (cleanName === inviteUsername.toLowerCase()) {
      setRequestStatus('error');
      setErrorMsg("You cannot send a connection request to yourself.");
      return;
    }

    const success = await sendRequest(cleanName);
    if (success) {
      setRequestStatus('success');
      setTargetUsername('');
      setTimeout(() => setRequestStatus('idle'), 2500);
    } else {
      setRequestStatus('error');
      setErrorMsg("Already connected, request pending, or request dispatch failed.");
      setTimeout(() => setRequestStatus('idle'), 4000);
    }
  };

  const handleChallenge = (_friend: Connection) => {
    const storedProfile = localStorage.getItem('patternlab_profile');
    let myName = 'Host';
    if (storedProfile) {
      try {
        myName = JSON.parse(storedProfile).displayName || myName;
      } catch {}
    }
    
    // Create CodeBuddy PVP room
    createRoom({
      timer: 30,
      mode: 'standard',
      companion: 'friend',
      problemSource: 'random',
      opponentType: 'friend',
      hostName: myName
    });
  };

  if (comparingConnection) {
    return <ProfileComparer connection={comparingConnection} onBack={() => setComparingConnection(null)} />;
  }

  if (selectedConnection) {
    return (
      <ConnectionProfileView 
        connection={selectedConnection} 
        onBack={() => setSelectedConnection(null)} 
        onCompare={() => {
          setComparingConnection(selectedConnection);
          setSelectedConnection(null);
        }}
      />
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-2 space-y-6 text-left">
      
      {/* ── Section 1: Dashboard Header & Stats ── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Users size={20} className="text-accent" />
            <span>Coding Connections</span>
          </h2>
          <p className="text-xs text-muted mt-1 leading-relaxed max-w-xl">
            Build your private engineering network. Compare topic masteries, track revision goals, and initialize real-time competitive DSA battles.
          </p>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => setShowPrivacySettings(!showPrivacySettings)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border hover:border-accent/40 rounded-xl text-xs font-bold text-muted hover:text-white transition-all active:scale-95"
          >
            <Settings size={13} />
            <span>Privacy Controls</span>
          </button>
        </div>
      </div>

      {/* ── Collapsible Privacy Settings Panel ── */}
      <AnimatePresence>
        {showPrivacySettings && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-surface/50 border border-border rounded-2xl p-5 overflow-hidden"
          >
            <h3 className="text-[10px] font-black text-white uppercase tracking-widest font-mono mb-3">CONNECTION PRIVACY CONTROLS</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Profile Visibility</label>
                <select 
                  value={privacySettings.profileVisibility} 
                  onChange={(e) => updatePrivacySettings({ profileVisibility: e.target.value as any })}
                  className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-primary font-bold outline-none focus:border-accent"
                >
                  <option value="public">Public (Anyone can view)</option>
                  <option value="connections">Connections Only</option>
                  <option value="private">Private (Only Me)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">PVP Battle Invites</label>
                <select 
                  value={privacySettings.battleInvites} 
                  onChange={(e) => updatePrivacySettings({ battleInvites: e.target.value as any })}
                  className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-primary font-bold outline-none focus:border-accent"
                >
                  <option value="anyone">Allow Battle Invites from anyone</option>
                  <option value="connections">Connections only</option>
                  <option value="none">Block all invites</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Online Presence Status</label>
                <select 
                  value={privacySettings.onlineStatus} 
                  onChange={(e) => updatePrivacySettings({ onlineStatus: e.target.value as any })}
                  className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-primary font-bold outline-none focus:border-accent"
                >
                  <option value="visible">Visible (Show Online status)</option>
                  <option value="invisible">Invisible (Appear offline)</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ════ LEFT COLUMN: MAIN GRID & INVITES ════ */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Invite Friend Widget */}
          <div className="bg-gradient-to-r from-accent/10 to-violet-900/10 border border-accent/20 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-[0_0_20px_rgba(124,111,247,0.05)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-accent">
                <Sparkles size={14} className="animate-pulse" />
                <h3 className="text-xs font-black uppercase tracking-wider font-mono">GROW YOUR CODING NETWORK</h3>
              </div>
              <p className="text-[11px] text-muted leading-relaxed">
                Generate invite link to compare progress side-by-side or launch PVP battles against developer colleagues.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="bg-background border border-border px-3.5 py-2 rounded-xl flex items-center gap-2 max-w-[240px] md:max-w-none w-full relative">
                <span className="font-mono text-[10px] text-violet-300 font-bold truncate max-w-[140px] md:max-w-[170px]">{inviteLink}</span>
                <button 
                  onClick={handleCopyLink}
                  className="p-1 rounded-lg text-muted hover:text-white hover:bg-white/5 transition-all shrink-0"
                  title="Copy Invite Link"
                >
                  {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                </button>
              </div>
            </div>
          </div>

          {/* Connect by Username Form */}
          <div className="bg-surface border border-border rounded-2xl p-4">
            <form onSubmit={handleSendRequest} className="flex gap-2">
              <input 
                value={targetUsername}
                onChange={e => setTargetUsername(e.target.value)}
                placeholder="Connect by invite username (e.g. tom_code)..."
                className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-xs font-mono text-primary outline-none focus:border-accent transition-colors"
              />
              <button 
                type="submit"
                disabled={requestStatus === 'sending'}
                className="px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold text-xs shadow-lg active:scale-95 transition-all flex items-center gap-1 shrink-0"
              >
                <Send size={11} />
                <span>Send Request</span>
              </button>
            </form>

            {requestStatus === 'error' && (
              <div className="text-[10px] text-rose-400 font-mono mt-1.5 flex items-center gap-1">
                <ShieldAlert size={10} />
                <span>{errorMsg}</span>
              </div>
            )}

            {requestStatus === 'success' && (
              <div className="text-[10px] text-emerald-400 font-mono mt-1.5 flex items-center gap-1">
                <Check size={10} />
                <span>Connection request dispatched!</span>
              </div>
            )}
          </div>

          {/* Connections Grid */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-white uppercase tracking-widest font-mono">YOUR CONNECTIONS ({connections.length})</h3>
            
            {connections.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {connections.map(conn => (
                  <motion.div 
                    key={conn.id}
                    layoutId={conn.id}
                    className="bg-surface border border-border rounded-2xl p-4 flex flex-col justify-between hover:border-accent/40 hover:shadow-lg transition-all group"
                  >
                    {/* Dev identity info */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="relative">
                          <img src={conn.avatarUrl} alt="" className="w-10 h-10 rounded-xl bg-white/5 p-1 shrink-0" />
                          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-surface ${conn.online ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-accent transition-colors flex items-center gap-1.5">
                            <span>{conn.displayName}</span>
                            <span className="text-[8px] font-mono font-bold text-muted uppercase">@{conn.username}</span>
                          </div>
                          <div className="text-[9px] text-muted flex items-center gap-1 mt-0.5 font-mono">
                            <Trophy size={9} className="text-amber-500" />
                            <span>{conn.rank}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] font-bold text-white font-mono">{conn.points} pts</div>
                        <div className="text-[8px] text-accent uppercase font-bold tracking-widest font-mono mt-0.5">Points</div>
                      </div>
                    </div>

                    {/* Behavior stats snippet */}
                    <div className="mt-3 bg-background/50 border border-border/40 rounded-xl p-2 text-[9px] text-muted flex justify-between gap-1 font-mono">
                      <div>Strongest: <span className="text-emerald-400 font-bold">{conn.strongestTopic}</span></div>
                      <div>Winstreak: <span className="text-orange-400 font-bold">{conn.stats.winStreak}</span></div>
                      <div>Avg Speed: <span className="text-white font-bold">{Math.floor(conn.stats.averageSpeed / 60)}m</span></div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 mt-4 pt-3 border-t border-border/40">
                      <button 
                        onClick={() => setSelectedConnection(conn)}
                        className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 font-bold text-[10px] text-white transition-all flex items-center justify-center gap-1 active:scale-95"
                      >
                        <Eye size={11} />
                        <span>Profile</span>
                      </button>
                      <button 
                        onClick={() => setComparingConnection(conn)}
                        className="flex-1 py-1.5 rounded-lg bg-accent/10 border border-accent/20 hover:bg-accent/15 font-bold text-[10px] text-accent transition-all flex items-center justify-center gap-1 active:scale-95"
                      >
                        <Activity size={11} />
                        <span>Compare</span>
                      </button>
                      <button 
                        onClick={() => handleChallenge(conn)}
                        className="flex-1 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 font-bold text-[10px] text-white transition-all flex items-center justify-center gap-1 active:scale-95"
                      >
                        <Swords size={11} />
                        <span>Challenge</span>
                      </button>
                    </div>

                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-surface/30 border border-dashed border-border p-8 rounded-2xl flex flex-col items-center justify-center text-center space-y-2">
                <Users size={24} className="text-muted/40 animate-bounce" />
                <div className="text-xs font-bold text-white">No Connections Found</div>
                <p className="text-[10px] text-muted max-w-xs leading-normal">
                  You haven't added anyone yet. Share your invite link or enter a developer's username to form a network!
                </p>
              </div>
            )}
          </div>

        </div>

        {/* ════ RIGHT COLUMN: SIDEBARS (PENDING & FEED) ════ */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-[10px] font-black text-rose-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                <UserPlus size={12} />
                <span>PENDING REQUESTS ({pendingRequests.length})</span>
              </h3>
              
              <div className="space-y-2">
                <AnimatePresence>
                  {pendingRequests.map(req => (
                    <motion.div 
                      key={req.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="bg-surface border border-border p-3 rounded-xl flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-2">
                        <img src={req.avatarUrl} alt="" className="w-8 h-8 rounded-lg bg-white/5 p-1 shrink-0" />
                        <div>
                          <div className="text-[11px] font-bold text-white">
                            {req.displayName}
                          </div>
                          <div className="text-[8px] text-muted font-mono truncate max-w-[130px]">
                            {req.rank}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-1.5 shrink-0 ml-2">
                        <button 
                          onClick={() => acceptRequest(req.id)}
                          className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/25 active:scale-90 transition-all"
                          title="Accept Request"
                        >
                          <UserCheck size={12} />
                        </button>
                        <button 
                          onClick={() => rejectRequest(req.id)}
                          className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center hover:bg-rose-500/25 active:scale-90 transition-all"
                          title="Reject Request"
                        >
                          <UserX size={12} />
                        </button>
                      </div>

                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Social Engineering Activity Feed */}
          <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
            <h3 className="text-[10px] font-black text-white uppercase tracking-widest font-mono flex items-center gap-1.5">
              <Activity size={12} className="text-accent animate-pulse" />
              <span>Activity Feed</span>
            </h3>
            
            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
              {activities.length > 0 ? (
                activities.map(act => (
                  <div key={act.id} className="flex gap-2.5 items-start text-left">
                    <img src={act.avatarUrl} alt="" className="w-7 h-7 rounded-lg bg-white/5 p-0.5 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[10px] text-white font-medium leading-relaxed">{act.text}</div>
                      <div className="text-[8px] text-muted font-mono mt-0.5">{act.timestamp}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-[10px] text-muted/40 py-8 font-mono">
                  No activity updates recorded yet.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
export default ConnectionsPanel;
