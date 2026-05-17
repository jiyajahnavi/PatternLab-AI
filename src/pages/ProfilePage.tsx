import React, { useEffect, useState } from 'react';
import {
  Calendar, MapPin, Edit2, Loader2,
  Flame, Trophy, X, Save, Check,
  Code2, Zap, AtSign, GitBranch,
  LayoutDashboard, BarChart3
} from 'lucide-react';
import { HeatmapCalendar } from '../components/profile/HeatmapCalendar';
import { LevelBreakdownChart } from '../components/profile/LevelBreakdownChart';
import { TopicMasteryGrid } from '../components/profile/TopicMasteryGrid';
import { ActivityLineChart } from '../components/profile/ActivityLineChart';
import { PatternDistributionChart } from '../components/profile/PatternDistributionChart';
import { AdvancedInsightsGrid } from '../components/profile/AdvancedInsightsGrid';
import { PredictiveProgressionChart } from '../components/profile/PredictiveProgressionChart';
import { SkillRadarPanel } from '../components/brain/SkillRadarPanel';
import { GlobalRankingPanel } from '../components/brain/RankingPanel';
import { useProgressStore } from '../store/useProgressStore';
import { useUserStore } from '../store/useUserStore';

interface ProfileData {
  displayName: string;
  bio: string;
  location: string;
  website: string;
  github: string;
  twitter: string;
}

const PROFILE_KEY = 'patternlab_profile';

const loadProfile = (): ProfileData => {
  try {
    const stored = localStorage.getItem(PROFILE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { displayName: '', bio: '', location: '', website: '', github: '', twitter: '' };
};

export const ProfilePage: React.FC = () => {
  const { currentStreak, points, topics, solvedProblems, mockPopulate } = useProgressStore();
  const { user } = useUserStore();
  const [isLoaded, setIsLoaded] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [profile, setProfile] = useState<ProfileData>(loadProfile);
  const [editDraft, setEditDraft] = useState<ProfileData>(profile);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics'>('overview');

  useEffect(() => {
    if (Object.keys(topics).length === 0 || topics['arrays']?.level1.total === 0) {
      mockPopulate();
    }
    setIsLoaded(true);
  }, [topics, mockPopulate]);

  useEffect(() => {
    if (user && !profile.displayName) {
      const googleName = user.user_metadata?.full_name || user.email?.split('@')[0] || '';
      setProfile(p => ({ ...p, displayName: googleName }));
      setEditDraft(p => ({ ...p, displayName: googleName }));
    }
  }, [user, profile.displayName]);

  const handleSave = () => {
    setProfile(editDraft);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(editDraft));
    setSaved(true);
    setTimeout(() => { setSaved(false); setShowEditModal(false); }, 1000);
  };

  const totalProblemsSolved = solvedProblems.length;
  const topicsMastered = Object.values(topics).filter(t => t.fullyCompleted).length;
  const totalTopics = Object.keys(topics).length;
  const avatarUrl = user?.user_metadata?.avatar_url;
  const displayName = profile.displayName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const avatarChar = displayName.charAt(0).toUpperCase();

  const joinDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'May 2026';

  if (!isLoaded) {
    return (
      <div className="h-full flex items-center justify-center bg-background text-primary">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-background text-primary flex flex-col">
      {/* ─── Hero Section ─── */}
      <div className="relative shrink-0">
        <div className="h-48 bg-gradient-to-r from-violet-900/40 via-purple-900/20 to-blue-900/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.2),transparent_70%)]" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(139,92,246,1) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,1) 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-12 -mt-20 relative z-10">
          <div className="flex flex-col md:flex-row gap-8 items-end">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-40 h-40 rounded-3xl ring-8 ring-background bg-gradient-to-br from-violet-600 to-blue-600 p-1 shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="w-full h-full rounded-[22px] object-cover" />
                ) : (
                  <div className="w-full h-full rounded-[22px] bg-surface flex items-center justify-center text-5xl font-black text-violet-500">
                    {avatarChar}
                  </div>
                )}
              </div>
              <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-green-500 border-4 border-background shadow-lg" />
            </div>

            {/* Identity Info */}
            <div className="flex-1 pb-2">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-4xl font-black tracking-tight text-white">{displayName}</h1>
                  <p className="text-violet-300/60 font-medium flex items-center gap-2 mt-1">
                    <AtSign size={14} /> {user?.email}
                  </p>
                </div>
                <button
                  onClick={() => { setEditDraft(profile); setShowEditModal(true); }}
                  className="flex items-center gap-2 text-sm font-bold text-white bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md px-5 py-2.5 rounded-xl transition-all active:scale-95"
                >
                  <Edit2 size={14} /> Edit Profile
                </button>
              </div>
              
              <div className="flex flex-wrap gap-6 text-sm text-violet-200/50">
                <div className="flex items-center gap-2"><MapPin size={16} className="text-violet-500" />{profile.location || 'Everywhere'}</div>
                <div className="flex items-center gap-2"><Calendar size={16} className="text-violet-500" />Joined {joinDate}</div>
                {profile.github && (
                  <a href={`https://github.com/${profile.github}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-white transition-colors">
                    <GitBranch size={16} className="text-violet-500" />@{profile.github}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Navigation Tabs ─── */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border mt-12">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex gap-8">
          {[
            { id: 'overview',  label: 'Overview',  icon: LayoutDashboard },
            { id: 'analytics', label: 'Analytics',   icon: BarChart3 },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-4 px-1 text-sm font-bold transition-all relative ${
                activeTab === tab.id ? 'text-violet-400' : 'text-muted hover:text-primary'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-400 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Main Content ─── */}
      <div className="flex-1 max-w-7xl mx-auto px-6 md:px-12 py-8 w-full space-y-8">
        
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Problems Solved', value: totalProblemsSolved, icon: Code2, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                { label: 'Topics Mastered', value: `${topicsMastered}/${totalTopics}`, icon: Trophy, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                { label: 'Current Streak', value: `${currentStreak} Days`, icon: Flame, color: 'text-orange-400', bg: 'bg-orange-500/10' },
                { label: 'Total Points', value: points.toLocaleString(), icon: Zap, color: 'text-violet-400', bg: 'bg-violet-500/10' },
              ].map(s => (
                <div key={s.label} className="bg-surface border border-border rounded-2xl p-5 flex items-center gap-4 group hover:border-violet-500/30 transition-all">
                  <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center ${s.color} shrink-0 group-hover:scale-110 transition-transform`}>
                    <s.icon size={24} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-muted uppercase tracking-widest">{s.label}</div>
                    <div className="text-xl font-black text-primary">{s.value}</div>
                  </div>
                </div>
              ))}
            </div>

            <GlobalRankingPanel />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8">
                <HeatmapCalendar />
              </div>
              <div className="lg:col-span-4">
                <SkillRadarPanel />
              </div>
            </div>
          </div>
        )}


        {activeTab === 'analytics' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <LevelBreakdownChart />
              <TopicMasteryGrid />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8 border-t border-border">
              <div className="lg:col-span-7">
                <ActivityLineChart />
              </div>
              <div className="lg:col-span-5">
                <PatternDistributionChart />
              </div>
            </div>
            
            <div className="pt-8 border-t border-border">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black text-primary">Advanced Intelligence</h2>
                  <p className="text-sm text-muted">Behavioral analysis and quality metrics from the PatternLab Brain</p>
                </div>
                <div className="px-4 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-full text-[10px] font-black text-violet-400 uppercase tracking-widest">
                  AI Generated
                </div>
              </div>
              <AdvancedInsightsGrid />
            </div>

            <div className="pt-8 border-t border-border">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black text-primary">Predictive Progression</h2>
                  <p className="text-sm text-muted">Forecasting your path to mastery based on current momentum</p>
                </div>
                <div className="px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-black text-blue-400 uppercase tracking-widest">
                  Trend Analysis
                </div>
              </div>
              <PredictiveProgressionChart />
            </div>

            <div className="bg-surface/10 border border-border border-dashed rounded-2xl p-8 text-center mt-8">
              <BarChart3 className="mx-auto text-muted/5 mb-4" size={24} />
              <p className="text-[10px] text-muted/20 font-black uppercase tracking-[0.2em]">Deep Intelligence Engine active</p>
            </div>
          </div>
        )}

      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowEditModal(false)} />
          <div className="relative z-10 bg-surface border border-border rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-8 py-6 border-b border-border bg-background/50">
              <h2 className="font-black text-primary text-xl">Edit Profile</h2>
              <button onClick={() => setShowEditModal(false)} className="text-muted hover:text-white transition-colors p-2 rounded-xl hover:bg-white/5">
                <X size={20} />
              </button>
            </div>

            <div className="px-8 py-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="text-xs font-black text-muted uppercase tracking-widest block mb-2 text-violet-400">Public Identity</label>
                  <div className="space-y-4">
                    <input
                      value={editDraft.displayName}
                      onChange={e => setEditDraft(d => ({ ...d, displayName: e.target.value }))}
                      placeholder="Display Name"
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-primary placeholder:text-muted/50 outline-none focus:border-violet-500 transition-colors"
                    />
                    <textarea
                      value={editDraft.bio}
                      onChange={e => setEditDraft(d => ({ ...d, bio: e.target.value }))}
                      placeholder="Tell the community about your DSA journey..."
                      rows={3}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-primary placeholder:text-muted/50 outline-none focus:border-violet-500 transition-colors resize-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black text-muted uppercase tracking-widest block mb-2 text-violet-400">Socials & Links</label>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="relative">
                      <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                      <input
                        value={editDraft.location}
                        onChange={e => setEditDraft(d => ({ ...d, location: e.target.value }))}
                        placeholder="Location"
                        className="w-full bg-background border border-border rounded-xl pl-12 pr-4 py-3 text-sm text-primary outline-none focus:border-violet-500 transition-colors"
                      />
                    </div>
                    <div className="relative">
                      <GitBranch size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                      <input
                        value={editDraft.github}
                        onChange={e => setEditDraft(d => ({ ...d, github: e.target.value }))}
                        placeholder="GitHub Username"
                        className="w-full bg-background border border-border rounded-xl pl-12 pr-4 py-3 text-sm text-primary outline-none focus:border-violet-500 transition-colors"
                      />
                    </div>
                    <div className="relative">
                      <AtSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                      <input
                        value={editDraft.twitter}
                        onChange={e => setEditDraft(d => ({ ...d, twitter: e.target.value }))}
                        placeholder="Twitter Username"
                        className="w-full bg-background border border-border rounded-xl pl-12 pr-4 py-3 text-sm text-primary outline-none focus:border-violet-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-8 py-6 border-t border-border bg-background/50 flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-6 py-2.5 text-sm font-bold text-muted hover:text-white transition-colors"
              >
                Discard
              </button>
              <button
                onClick={handleSave}
                className="px-8 py-2.5 text-sm font-black bg-violet-600 text-white rounded-xl hover:bg-violet-500 transition-all flex items-center gap-2 shadow-lg shadow-violet-500/20 active:scale-95"
              >
                {saved ? <><Check size={16} /> Updated!</> : <><Save size={16} /> Save Profile</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
