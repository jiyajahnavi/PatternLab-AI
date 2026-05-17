import React from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, Shield, Target, Activity, 
  TrendingUp, TrendingDown, MessageSquare, 
  Star, Sparkles
} from 'lucide-react';
import { useBrainStore, getTierInfo } from '../../store/useBrainStore';

export const AdvancedInsightsGrid: React.FC = () => {
  const { rating, behavioralTraits, personalitySummary, sessions } = useBrainStore();
  const tierInfo = getTierInfo(rating.overall);

  const stats = [
    { label: 'Code Quality', value: rating.codeQuality, icon: Shield, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Optimization', value: rating.optimization, icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Debugging', value: rating.debugging, icon: Target, color: 'text-rose-400', bg: 'bg-rose-500/10' },
    { label: 'Consistency', value: rating.consistency, icon: Activity, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  ];

  if (sessions.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-12 text-center flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-violet-500/10 flex items-center justify-center mb-6">
          <Sparkles className="text-violet-500" size={32} />
        </div>
        <h3 className="text-xl font-bold text-primary mb-2">No Advanced Insights Yet</h3>
        <p className="text-muted text-sm max-w-md mx-auto">
          Start practicing with the AI Mentor in the Practice Lab to generate deep behavioral insights and quality ratings.
        </p>
      </div>
    );
  }

  const strengths = behavioralTraits.filter(t => t.type === 'strength');
  const weaknesses = behavioralTraits.filter(t => t.type === 'weakness');

  return (
    <div className="space-y-8">
      {/* Quality Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-surface border border-border rounded-2xl p-5 hover:border-violet-500/30 transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <div className="text-2xl font-black text-primary">{stat.value}%</div>
            </div>
            <div className="text-[10px] font-black text-muted uppercase tracking-widest">{stat.label}</div>
            <div className="mt-3 h-1.5 w-full bg-background rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stat.value}%` }}
                className={`h-full ${stat.color.replace('text-', 'bg-')} transition-all duration-1000 ease-out`}
              />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Traits & Personality */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-surface border border-border rounded-2xl p-6 h-full relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center gap-3 mb-6">
              <MessageSquare className="text-violet-400" size={20} />
              <h3 className="text-lg font-bold text-primary">Coding Persona</h3>
            </div>

            <div className="relative">
              <div className="text-4xl absolute -top-4 -left-2 opacity-10 pointer-events-none">"</div>
              <p className="text-sm text-violet-200/70 leading-relaxed italic px-4">
                {personalitySummary || "Your coding style is still being analyzed. Complete more sessions to unlock your unique developer persona summary."}
              </p>
              <div className="text-4xl absolute -bottom-8 -right-2 opacity-10 pointer-events-none">"</div>
            </div>

            {/* Tier Badge */}
            <div className="mt-12 flex items-center gap-4 bg-white/5 border border-white/5 rounded-2xl p-4">
              <div className={`w-12 h-12 rounded-xl ${tierInfo.bg} flex items-center justify-center text-2xl`}>
                {tierInfo.icon}
              </div>
              <div>
                <div className="text-[10px] font-black text-muted uppercase tracking-widest">Brain Ranking Tier</div>
                <div className={`text-lg font-black ${tierInfo.color}`}>{tierInfo.tier}</div>
              </div>
              <div className="ml-auto text-right">
                <div className="text-[10px] font-black text-muted uppercase tracking-widest">Global Rank</div>
                <div className="text-lg font-black text-white">Top {rating.percentileRank}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-surface border border-border rounded-2xl p-6 h-full">
            <h3 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">
              <Star className="text-yellow-400" size={18} />
              Behavioral Insights
            </h3>

            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3">
                  <TrendingUp size={12} /> Key Strengths
                </div>
                <div className="space-y-2">
                  {strengths.length > 0 ? strengths.map((s, i) => (
                    <div key={i} className="text-xs bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 text-emerald-100/70">
                      <span className="font-bold text-emerald-400 block mb-0.5">{s.trait}</span>
                      {s.description}
                    </div>
                  )) : (
                    <div className="text-[10px] text-muted italic">Identifying strengths...</div>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-[10px] font-black text-rose-400 uppercase tracking-widest mb-3">
                  <TrendingDown size={12} /> Areas for Growth
                </div>
                <div className="space-y-2">
                  {weaknesses.length > 0 ? weaknesses.map((w, i) => (
                    <div key={i} className="text-xs bg-rose-500/5 border border-rose-500/10 rounded-xl p-3 text-rose-100/70">
                      <span className="font-bold text-rose-400 block mb-0.5">{w.trait}</span>
                      {w.description}
                    </div>
                  )) : (
                    <div className="text-[10px] text-muted italic">Analyzing weaknesses...</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
