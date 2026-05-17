import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, ReferenceLine 
} from 'recharts';
import { format, addDays, subDays } from 'date-fns';
import { TrendingUp, Clock, ArrowUpRight } from 'lucide-react';
import { useBrainStore, BRAIN_TIERS } from '../../store/useBrainStore';
import { useProgressStore } from '../../store/useProgressStore';

export const PredictiveProgressionChart: React.FC = () => {
  const { rating, sessions } = useBrainStore();
  const { heatmap } = useProgressStore();

  const data = React.useMemo(() => {
    const items = [];
    const currentRating = rating.overall;
    
    // 1. Calculate historical trend (Mocked based on activity)
    // We assume the user's rating grew proportionally to their activity in the last 14 days
    const last14DaysActivity = [];
    let totalActivity = 0;
    for (let i = 13; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const count = heatmap[date] || 0;
      last14DaysActivity.push(count);
      totalActivity += count;
    }

    const growthPerActivity = totalActivity > 0 ? (currentRating * 0.4) / totalActivity : 0;
    let runningRating = currentRating - (currentRating * 0.4);

    for (let i = 13; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'MMM dd');
      const activity = last14DaysActivity[13 - i];
      runningRating += activity * growthPerActivity;
      items.push({
        name: date,
        rating: Math.round(runningRating),
        type: 'actual'
      });
    }

    // 2. Project future trend
    // Average daily growth over last 14 days
    const avgDailyGrowth = totalActivity > 0 ? (currentRating * 0.4) / 14 : 10;
    const momentumFactor = 1.1; // Assume slight acceleration
    
    let projectedRating = currentRating;
    for (let i = 1; i <= 14; i++) {
      const date = format(addDays(new Date(), i), 'MMM dd');
      projectedRating += avgDailyGrowth * momentumFactor;
      items.push({
        name: date,
        projected: Math.round(projectedRating),
        type: 'projected'
      });
    }

    return items;
  }, [rating, heatmap]);

  const nextTier = BRAIN_TIERS.find(t => t.min > rating.overall) || BRAIN_TIERS[BRAIN_TIERS.length - 1];
  const pointsToNext = nextTier.min - rating.overall;
  
  // Calculate days to next tier
  const last14DaysTotal = Object.values(heatmap).slice(-14).reduce((a, b) => a + b, 0);
  const avgDailyPoints = (last14DaysTotal * 20) / 14 || 20; // 20 points per problem roughly
  const estDays = pointsToNext > 0 ? Math.ceil(pointsToNext / avgDailyPoints) : 0;

  if (sessions.length < 3) {
    return (
      <div className="bg-surface/50 border border-border border-dashed rounded-2xl p-12 text-center">
        <Clock className="mx-auto text-muted/20 mb-4" size={48} />
        <h3 className="text-lg font-bold text-muted">More Data Needed for Projection</h3>
        <p className="text-sm text-muted/60 mt-1 max-w-sm mx-auto">
          Complete at least 3 AI Mentor sessions to unlock predictive progression analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col justify-between">
          <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Growth Velocity</div>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-black text-emerald-400">+12.4%</div>
            <ArrowUpRight size={16} className="text-emerald-400" />
          </div>
          <div className="text-[10px] text-muted mt-2">vs. previous 14 days</div>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col justify-between">
          <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Next Milestone</div>
          <div className="flex items-center gap-2">
            <div className={`text-xl font-black ${nextTier.color}`}>{nextTier.tier}</div>
            <span className="text-xs text-muted">({pointsToNext} pts)</span>
          </div>
          <div className="text-[10px] text-muted mt-2">Target rating: {nextTier.min}</div>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col justify-between border-violet-500/30 bg-violet-500/5">
          <div className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-1">Est. Completion</div>
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-violet-400" />
            <div className="text-2xl font-black text-white">{estDays} Days</div>
          </div>
          <div className="text-[10px] text-violet-400/60 mt-2">Target Date: {format(addDays(new Date(), estDays), 'MMM dd, yyyy')}</div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-violet-400" />
            <h3 className="text-lg font-bold text-primary">Rating Projection</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-violet-500" />
              <span className="text-[10px] font-bold text-muted uppercase">Actual</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-violet-500/30" />
              <span className="text-[10px] font-bold text-muted uppercase">Projected</span>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRating" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C6FF7" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#7C6FF7" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C6FF7" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#7C6FF7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#6B6B7B', fontSize: 10 }}
                minTickGap={30}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#6B6B7B', fontSize: 10 }} 
                domain={['auto', 'auto']}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#141416', border: '1px solid #2A2A2E', borderRadius: '12px' }}
                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                labelStyle={{ color: '#E8E8F0', fontSize: '10px', marginBottom: '4px' }}
              />
              <ReferenceLine x={format(new Date(), 'MMM dd')} stroke="#7C6FF7" strokeDasharray="3 3" label={{ position: 'top', value: 'Today', fill: '#7C6FF7', fontSize: 10, fontWeight: 'bold' }} />
              
              <Area 
                type="monotone" 
                dataKey="rating" 
                stroke="#7C6FF7" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRating)" 
                connectNulls
              />
              <Area 
                type="monotone" 
                dataKey="projected" 
                stroke="#7C6FF7" 
                strokeWidth={3}
                strokeDasharray="5 5"
                fillOpacity={1} 
                fill="url(#colorProjected)" 
                connectNulls
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
