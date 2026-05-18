import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Calendar, MapPin, Trophy, Flame, 
  Zap, Code2, Swords, Activity, User, Target, Sparkles, Compass, Users
} from 'lucide-react';
import type { Connection } from '../../store/useConnectionsStore';

interface ConnectionProfileViewProps {
  connection: Connection;
  onBack: () => void;
  onCompare: () => void;
}

export const ConnectionProfileView: React.FC<ConnectionProfileViewProps> = ({ 
  connection, 
  onBack, 
  onCompare 
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'codebuddy'>('overview');

  // Compute mock detailed progress totals
  const totalSolved = connection.solvedProblems.length || 10;
  const totalTopics = Object.keys(connection.progress).length || 10;
  const masteredTopics = Object.values(connection.progress).filter(t => t.fullyCompleted).length || 2;

  return (
    <div className="min-h-full bg-background text-primary flex flex-col text-left">
      
      {/* ─── Hero Banner Section ─── */}
      <div className="relative shrink-0">
        <div className="h-44 bg-gradient-to-r from-accent/30 via-violet-900/10 to-blue-900/10 relative overflow-hidden">
          <button 
            onClick={onBack}
            className="absolute top-4 left-4 z-30 flex items-center gap-1.5 px-3 py-1.5 bg-black/40 hover:bg-black/60 border border-white/10 backdrop-blur-md rounded-xl text-xs font-bold text-white transition-all active:scale-95 shadow-lg"
          >
            <ArrowLeft size={13} />
            <span>Connections</span>
          </button>
          
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(124,111,247,0.15),transparent_70%)]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 -mt-16 relative z-10">
          <div className="flex flex-col md:flex-row gap-6 items-end">
            
            {/* Avatar with dynamic online ring */}
            <div className="relative">
              <div className="w-32 h-32 rounded-3xl ring-6 ring-background bg-gradient-to-br from-accent to-violet-600 p-0.5 shadow-2xl">
                <img src={connection.avatarUrl} alt="" className="w-full h-full rounded-[22px] bg-surface object-cover p-1.5" />
              </div>
              <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-4 border-background shadow-lg ${connection.online ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
            </div>

            {/* Profile Info */}
            <div className="flex-1 pb-2">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
                    <span>{connection.displayName}</span>
                    <span className="text-xs font-mono font-bold text-muted uppercase">@{connection.username}</span>
                  </h1>
                  <p className="text-accent text-xs font-mono font-bold uppercase tracking-wider mt-0.5">{connection.brainRating.tier} Developer</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={onCompare}
                    className="flex items-center gap-2 text-xs font-black text-accent bg-accent/10 hover:bg-accent/15 border border-accent/25 px-5 py-2.5 rounded-xl transition-all active:scale-95 shadow-lg shadow-accent/5"
                  >
                    <Activity size={13} />
                    <span>Compare Profiles</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-xs text-muted">
                <div className="flex items-center gap-1.5"><MapPin size={13} className="text-accent" />{connection.location || 'Remote'}</div>
                <div className="flex items-center gap-1.5"><Calendar size={13} className="text-accent" />Joined PatternLab May 2026</div>
                {connection.github && (
                  <a href={`https://github.com/${connection.github}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-white transition-colors">
                    <Code2 size={13} className="text-accent" />@{connection.github}
                  </a>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ─── Navigation Tabs ─── */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border mt-8">
        <div className="max-w-7xl mx-auto px-6 flex gap-8">
          {[
            { id: 'overview',  label: 'Overview',  icon: User },
            { id: 'analytics', label: 'Analytics',   icon: Target },
            { id: 'codebuddy', label: 'CodeBuddy Stats', icon: Swords },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 py-4 px-1 text-xs font-bold transition-all relative ${
                activeTab === tab.id ? 'text-accent' : 'text-muted hover:text-primary'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="conn-profile-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Tab Content ─── */}
      <div className="flex-1 max-w-7xl mx-auto px-6 py-6 w-full space-y-6">
        
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Problems Solved', value: totalSolved, icon: Code2, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                { label: 'Topics Mastered', value: `${masteredTopics}/${totalTopics}`, icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
                { label: 'Current Streak', value: `${connection.stats.winStreak} Days`, icon: Flame, color: 'text-orange-400', bg: 'bg-orange-500/10' },
                { label: 'Total Points', value: connection.points.toLocaleString(), icon: Zap, color: 'text-accent', bg: 'bg-accent/10' },
              ].map(s => (
                <div key={s.label} className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-3.5 hover:border-accent/20 transition-all">
                  <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center ${s.color} shrink-0`}>
                    <s.icon size={22} />
                  </div>
                  <div>
                    <div className="text-[9px] font-bold text-muted uppercase tracking-widest">{s.label}</div>
                    <div className="text-lg font-black text-white mt-0.5">{s.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Global Placement Banner */}
            <div className="bg-surface border border-border rounded-2xl p-5 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full blur-2xl pointer-events-none" />
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase font-mono tracking-wider">
                  <Trophy size={13} className="text-yellow-500" />
                  <span>PLATINUM TIER RATING PLACEMENT</span>
                </h3>
                <p className="text-[11px] text-muted max-w-xl">
                  {connection.displayName} ranks in the **Top {connection.brainRating.percentileRank}%** of all active PatternLab developers, maintaining a high solution efficiency index.
                </p>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-accent font-mono">Rank Percentile: Top {connection.brainRating.percentileRank}%</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Streaks and consistency summary */}
              <div className="lg:col-span-8 bg-surface border border-border rounded-2xl p-5">
                <h3 className="text-xs font-bold text-white mb-4 uppercase tracking-wider font-mono">Consistency & Activity Logs</h3>
                
                {/* Mock Heatmap summary */}
                <div className="grid grid-cols-7 gap-2 max-w-lg">
                  {Array.from({ length: 28 }).map((_, idx) => {
                    const level = idx % 5 === 0 ? 0 : (idx % 3 === 0 ? 3 : (idx % 2 === 0 ? 1 : 2));
                    const colors = [
                      'bg-white/5 border-white/5',
                      'bg-emerald-500/10 border-emerald-500/10',
                      'bg-emerald-500/30 border-emerald-500/20',
                      'bg-emerald-500/60 border-emerald-500/40'
                    ];
                    return (
                      <div 
                        key={idx} 
                        className={`w-full aspect-square rounded border ${colors[level]} relative group`}
                        title={`Day ${idx + 1}: ${level} problem solves`}
                      >
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 bg-background border border-border text-[8px] rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap pointer-events-none">
                          {level} solves
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[9px] text-muted font-mono mt-4">
                  <span>28 Days consistency track</span>
                  <div className="flex gap-1 items-center">
                    <span>Less</span>
                    <span className="w-2.5 h-2.5 bg-white/5 rounded border border-white/5" />
                    <span className="w-2.5 h-2.5 bg-emerald-500/10 rounded border border-emerald-500/10" />
                    <span className="w-2.5 h-2.5 bg-emerald-500/30 rounded border border-emerald-500/20" />
                    <span className="w-2.5 h-2.5 bg-emerald-500/60 rounded border border-emerald-500/40" />
                    <span>More</span>
                  </div>
                </div>
              </div>

              {/* Traits Panel */}
              <div className="lg:col-span-4 bg-surface border border-border rounded-2xl p-5">
                <h3 className="text-xs font-bold text-white mb-4 uppercase tracking-wider font-mono">Brain Behavioral Traits</h3>
                <div className="space-y-3">
                  {[
                    { title: 'Linear Space Champion', desc: 'Prioritizes O(1) auxiliary pointer operations over hashing buffers.', type: 'strength' },
                    { title: 'DP Mastery', desc: 'Expert in memoized top-down recursion caching.', type: 'strength' },
                    { title: 'String Traversal Weakness', desc: 'Struggles with Sliding Window boundary index margins.', type: 'weakness' }
                  ].map((trait, idx) => (
                    <div key={idx} className="bg-background/40 border border-border/50 p-2.5 rounded-xl text-left">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${trait.type === 'strength' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        <span className="text-[10px] font-bold text-white">{trait.title}</span>
                      </div>
                      <p className="text-[9px] text-muted mt-1 leading-normal">{trait.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Level breakdown cards */}
              <div className="bg-surface border border-border rounded-2xl p-5">
                <h3 className="text-xs font-bold text-white mb-4 uppercase tracking-wider font-mono">Difficulty Breakdown</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Level 1 (Easy)', count: totalSolved >= 10 ? Math.round(totalSolved * 0.5) : 5, total: 20, color: 'bg-emerald-500' },
                    { label: 'Level 2 (Medium)', count: totalSolved >= 10 ? Math.round(totalSolved * 0.4) : 4, total: 30, color: 'bg-blue-400' },
                    { label: 'Level 3 (Hard)', count: totalSolved >= 10 ? Math.round(totalSolved * 0.1) : 1, total: 15, color: 'bg-rose-500' },
                  ].map(lvl => (
                    <div key={lvl.label} className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-muted">{lvl.label}</span>
                        <span className="text-white font-bold">{lvl.count} / {lvl.total} Solved</span>
                      </div>
                      <div className="h-2 bg-background border border-border/40 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${lvl.color} rounded-full`}
                          style={{ width: `${(lvl.count / lvl.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Topic Mastery badges */}
              <div className="bg-surface border border-border rounded-2xl p-5">
                <h3 className="text-xs font-bold text-white mb-4 uppercase tracking-wider font-mono">Topic Mastery Badges</h3>
                <div className="flex flex-wrap gap-2.5">
                  {Object.values(connection.progress).map(topic => (
                    <div 
                      key={topic.id}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 border transition-all ${
                        topic.level1.solved + topic.level2.solved + topic.level3.solved > 5
                          ? 'bg-accent/15 border-accent/30 text-accent shadow-[0_0_12px_rgba(124,111,247,0.1)]' 
                          : 'bg-background border-border text-muted'
                      }`}
                    >
                      <Target size={11} />
                      <span>{topic.name}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* AI Smart analysis overview */}
            <div className="bg-surface border border-border rounded-2xl p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">AI Behavioral Assessment</h3>
                <span className="px-2 py-0.5 bg-violet-600/10 border border-violet-500/20 rounded-full text-[8px] font-black text-violet-400 uppercase tracking-widest font-mono">PatternLab Brain Insight</span>
              </div>
              
              <div className="space-y-4">
                <div className="bg-background/40 border border-border/40 p-3.5 rounded-xl">
                  <h4 className="text-[10px] font-bold text-white mb-1.5">DSA Personality Summary</h4>
                  <p className="text-[11px] text-muted leading-relaxed">
                    A highly methodical solver who thrives on standard loops but exhibits minor overhead in complex two-pointer bounds. Shows low hint dependency.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-background/40 border border-border/40 p-3.5 rounded-xl">
                    <h4 className="text-[10px] font-bold text-emerald-400 mb-1.5 flex items-center gap-1">
                      <Sparkles size={11} />
                      <span>Observed Strengths</span>
                    </h4>
                    <ul className="text-[10px] text-muted space-y-1 list-disc list-inside">
                      <li>Fast runtime speeds on standard HashMap indices.</li>
                      <li>High code quality metrics and documentation.</li>
                    </ul>
                  </div>

                  <div className="bg-background/40 border border-border/40 p-3.5 rounded-xl">
                    <h4 className="text-[10px] font-bold text-rose-400 mb-1.5 flex items-center gap-1">
                      <Compass size={11} />
                      <span>Optimization Focus</span>
                    </h4>
                    <ul className="text-[10px] text-muted space-y-1 list-disc list-inside">
                      <li>Frequent brute force nesting on multi-condition graphs.</li>
                      <li>Boundary cases on logarithmic binary answers.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'codebuddy' && (
          <div className="space-y-6">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Battle Points', value: `${connection.stats.points} pts`, icon: Swords, color: 'text-accent', bg: 'bg-accent/10' },
                { label: 'Win Ratio (W/L)', value: `${Math.round((connection.stats.wins / Math.max(1, connection.stats.totalMatches)) * 100)}% (${connection.stats.wins}W / ${connection.stats.losses}L)`, icon: Trophy, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                { label: 'Win Streak', value: `${connection.stats.winStreak} Matches`, icon: Flame, color: 'text-orange-400', bg: 'bg-orange-500/10' },
                { label: 'Total Matches', value: `${connection.stats.totalMatches} Battles`, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
              ].map(s => (
                <div key={s.label} className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-3.5 hover:border-accent/20 transition-all">
                  <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center ${s.color} shrink-0`}>
                    <s.icon size={22} />
                  </div>
                  <div>
                    <div className="text-[9px] font-bold text-muted uppercase tracking-widest">{s.label}</div>
                    <div className="text-lg font-black text-white mt-0.5">{s.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Split details */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              <div className="lg:col-span-8 bg-surface border border-border rounded-2xl p-5">
                <h3 className="text-xs font-bold text-white mb-4 uppercase tracking-wider font-mono">Multiplayer Coding Details</h3>
                
                <div className="space-y-3 font-mono text-[10px]">
                  <div className="flex justify-between items-center bg-background/50 border border-border/40 p-3 rounded-xl">
                    <span className="text-muted">Strongest Battle Pattern</span>
                    <span className="font-bold text-emerald-400">{connection.stats.strongestTopic}</span>
                  </div>
                  
                  <div className="flex justify-between items-center bg-background/50 border border-border/40 p-3 rounded-xl">
                    <span className="text-muted">Weakest Battle Pattern</span>
                    <span className="font-bold text-rose-400">{connection.stats.weakestTopic}</span>
                  </div>
                  
                  <div className="flex justify-between items-center bg-background/50 border border-border/40 p-3 rounded-xl">
                    <span className="text-muted">Average Solve Speed</span>
                    <span className="font-bold text-white">
                      {Math.floor(connection.stats.averageSpeed / 60)}m {connection.stats.averageSpeed % 60}s
                    </span>
                  </div>
                </div>
              </div>

              {/* Optimization gauge */}
              <div className="lg:col-span-4 bg-surface border border-border rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                <h4 className="text-[9px] font-black text-muted uppercase tracking-widest font-mono mb-3">OPTIMIZATION GAUGE</h4>
                
                <div className="w-24 h-24 rounded-full border-4 border-accent/20 flex items-center justify-center relative mb-3 shadow-[0_0_20px_rgba(124,111,247,0.03)]">
                  <div className="absolute inset-1.5 rounded-full border border-accent/40 bg-accent/5 flex items-center justify-center flex-col">
                    <span className="text-lg font-black text-white font-mono">{connection.stats.optimizationRating}%</span>
                    <span className="text-[8px] text-accent uppercase font-bold tracking-widest font-mono">Rating</span>
                  </div>
                </div>
                
                <p className="text-[9px] text-muted leading-relaxed max-w-[170px]">
                  Weighted battle efficiency index based on complexity scores, edges, and code readability ratios.
                </p>
              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
};
export default ConnectionProfileView;
