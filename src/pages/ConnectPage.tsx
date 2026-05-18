import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Trophy, Flame, Zap, Award, UserPlus, ArrowRight, ShieldCheck, Heart, ShieldAlert } from 'lucide-react';
import { useConnectionsStore } from '../store/useConnectionsStore';
import { useUserStore } from '../store/useUserStore';

export const ConnectPage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { sendRequest } = useConnectionsStore();
  const { user } = useUserStore();
  
  const [requestSent, setRequestSent] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Load target profile from public registry if available, else fallback
  const registry = JSON.parse(localStorage.getItem('patternlab_public_profiles') || '{}');
  const targetProfile = username ? registry[username.toLowerCase().trim()] : null;

  // Determine display stats
  const displayName = targetProfile ? targetProfile.displayName : (username ? username.charAt(0).toUpperCase() + username.slice(1) : 'Developer');
  const points = targetProfile ? targetProfile.points : 0;
  const rank = targetProfile ? targetProfile.rank : 'Learner';
  const strongestTopic = targetProfile ? targetProfile.strongestTopic : 'Arrays';
  const tier = targetProfile ? (targetProfile.brainRating?.tier || 'Solver') : 'Solver';
  const avatarUrl = targetProfile 
    ? targetProfile.avatarUrl 
    : `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username || 'dev')}`;

  const handleConnect = async () => {
    if (!username || !user) return;
    setIsSending(true);
    
    // Send request via connections store
    await sendRequest(username);
    
    setTimeout(() => {
      setIsSending(false);
      setRequestSent(true);
    }, 1200);
  };

  return (
    <div className="min-h-full bg-background text-primary flex items-center justify-center py-12 px-6 relative">
      
      {/* ── Outer glowing halos ── */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(124,111,247,1) 1px, transparent 1px), linear-gradient(90deg, rgba(124,111,247,1) 1px, transparent 1px)`,
          backgroundSize: '30px 30px',
        }}
      />

      <div className="w-full max-w-md relative z-10">
        
        {/* Logo/Branding Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent mx-auto mb-3 shadow-[0_0_20px_rgba(124,111,247,0.15)]">
            <Swords size={22} className="animate-pulse" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">PatternLab CodeBuddy</h2>
          <p className="text-xs text-muted mt-1">Connect, compare progress, and challenge each other in real-time.</p>
        </div>

        {/* Profile Card Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-surface border border-border rounded-3xl p-6 shadow-2xl relative overflow-hidden"
        >
          {/* Card Ambient Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col items-center text-center">
            
            {/* Avatar & Status indicator */}
            <div className="relative mb-4">
              <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-accent to-violet-600 p-0.5 shadow-xl">
                <img src={avatarUrl} alt={displayName} className="w-full h-full rounded-[22px] bg-background object-cover p-1.5" />
              </div>
              <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 border-4 border-surface shadow-lg" />
            </div>

            {/* User Title Info */}
            <h1 className="text-2xl font-black text-white">{displayName}</h1>
            <p className="text-xs font-mono text-accent mt-0.5 font-bold uppercase tracking-wider">{tier} Developer</p>
            
            <div className="inline-flex items-center gap-1.5 bg-accent/10 border border-accent/20 px-3 py-1 rounded-full text-[10px] font-bold text-accent mt-3 shadow-[0_0_15px_rgba(124,111,247,0.05)]">
              <Trophy size={11} />
              <span>{rank}</span>
            </div>

            {/* Quick Metrics grid */}
            <div className="grid grid-cols-3 gap-3.5 w-full mt-6 border-t border-b border-border/60 py-5">
              <div className="flex flex-col items-center">
                <Zap size={18} className="text-accent mb-1" />
                <span className="text-[9px] font-bold text-muted uppercase tracking-wider">Points</span>
                <span className="text-sm font-black text-white mt-0.5">{points}</span>
              </div>

              <div className="flex flex-col items-center border-l border-r border-border/60">
                <Flame size={18} className="text-orange-400 mb-1" />
                <span className="text-[9px] font-bold text-muted uppercase tracking-wider">Streak</span>
                <span className="text-sm font-black text-white mt-0.5">{(targetProfile as any)?.stats?.winStreak || 6} Days</span>
              </div>

              <div className="flex flex-col items-center">
                <Award size={18} className="text-yellow-500 mb-1" />
                <span className="text-[9px] font-bold text-muted uppercase tracking-wider">Strongest</span>
                <span className="text-[11px] font-black text-white mt-0.5 truncate max-w-[80px]">{strongestTopic}</span>
              </div>
            </div>

            {/* Personal bio overlay */}
            <p className="text-xs text-muted mt-5 italic leading-relaxed max-w-xs">
              "{targetProfile?.bio || 'Let\'s connect and tackle complex algorithmic patterns together. Let the battles begin!'}"
            </p>

            {/* Action buttons */}
            <div className="w-full mt-6">
              <AnimatePresence mode="wait">
                {!user ? (
                  <motion.div
                    key="login-prompt"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-[11px] text-amber-400 leading-normal flex items-start gap-2 text-left">
                      <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                      <span>You must be logged in to PatternLab to send a connection request.</span>
                    </div>
                    <motion.button
                      onClick={() => navigate('/login')}
                      className="w-full py-3 rounded-xl bg-accent hover:bg-accent-hover text-white font-black text-xs shadow-xl shadow-accent/25 flex items-center justify-center gap-2 active:scale-95 transition-all"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <UserPlus size={14} />
                      <span>Log In to PatternLab</span>
                    </motion.button>
                  </motion.div>
                ) : !requestSent ? (
                  <motion.button
                    key="connect-btn"
                    onClick={handleConnect}
                    disabled={isSending}
                    className="w-full py-3 rounded-xl bg-accent hover:bg-accent-hover text-white font-black text-xs shadow-xl shadow-accent/25 flex items-center justify-center gap-2 active:scale-95 transition-all"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    {isSending ? (
                      <>
                        <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                        <span>Sending Request...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus size={14} />
                        <span>Send Connection Request</span>
                      </>
                    )}
                  </motion.button>
                ) : (
                  <motion.div
                    key="success-btn"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.05)]"
                  >
                    <ShieldCheck size={14} className="text-emerald-400 animate-bounce" />
                    <span>Connection Request Sent!</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Redirect option */}
              <button
                onClick={() => navigate('/codebuddy')}
                className="w-full text-center text-[10px] text-muted hover:text-white transition-colors mt-4 flex items-center justify-center gap-1 group"
              >
                <span>Enter CodeBuddy Dashboard</span>
                <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

          </div>
        </motion.div>
        
        {/* Footer */}
        <div className="text-center text-[10px] text-muted/60 mt-6 flex items-center justify-center gap-1 font-mono">
          <span>Engineered with</span>
          <Heart size={8} className="text-rose-500 fill-rose-500 animate-pulse" />
          <span>by PatternLab Brain</span>
        </div>

      </div>
    </div>
  );
};
export default ConnectPage;
