import React, { useEffect, useState } from 'react';
import {
  Calendar, MapPin, Edit2, Loader2,
  Flame, Trophy, X, Save, Check,
  Code2, Zap, AtSign, GitBranch,
  LayoutDashboard, BarChart3, Users, Swords,
  Wand2, Sparkles
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
import { useCodeBuddyStore } from '../store/useCodeBuddyStore';

interface ProfileData {
  displayName: string;
  bio: string;
  location: string;
  website: string;
  github: string;
  linkedin: string;
  avatarUrl?: string;
  username?: string;
  usernameChangesRemaining?: number;
}

const AVATARS = [
  { id: 'pixel-1', name: 'Alpha Pixel', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Alpha&backgroundColor=b6e3f4' },
  { id: 'pixel-2', name: 'Nexus Pixel', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Nexus&backgroundColor=c0b2f0' },
  { id: 'pixel-3', name: 'Cortex Pixel', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Cortex&backgroundColor=ffe082' },
  { id: 'pixel-4', name: 'Byte Pixel', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Byte&backgroundColor=a5d6a7' },
  { id: 'pixel-5', name: 'Matrix Pixel', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Matrix&backgroundColor=80cbc4' },
  { id: 'pixel-6', name: 'Vector Pixel', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Vector&backgroundColor=ffcc80' },
  { id: 'pixel-7', name: 'Giga Pixel', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Giga&backgroundColor=ef9a9a' },
  { id: 'pixel-8', name: 'Quantum Pixel', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Quantum&backgroundColor=b39ddb' },
  { id: 'pixel-9', name: 'Aero Pixel', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Aero&backgroundColor=80deea' },
  { id: 'pixel-10', name: 'Volt Pixel', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Volt&backgroundColor=fff59d' },
  { id: 'pixel-11', name: 'Chrono Pixel', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Chrono&backgroundColor=b0bec5' },
  { id: 'pixel-12', name: 'Nano Pixel', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Nano&backgroundColor=f48fb1' },
  { id: 'pixel-13', name: 'Cyber Pixel', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Cyber&backgroundColor=90caf9' },
  { id: 'pixel-14', name: 'Echo Pixel', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Echo&backgroundColor=ffab91' },
  { id: 'pixel-15', name: 'Apex Pixel', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Apex&backgroundColor=b0bec5' },
  { id: 'pixel-16', name: 'Gizmo Pixel', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Gizmo&backgroundColor=ffb74d' },
  { id: 'pixel-17', name: 'Tesla Pixel', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Tesla&backgroundColor=bcaaa4' },
  { id: 'pixel-18', name: 'Orbit Pixel', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Orbit&backgroundColor=9fa8da' },
  { id: 'pixel-19', name: 'Titan Pixel', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Titan&backgroundColor=cfd8dc' },
  { id: 'pixel-20', name: 'Void Pixel', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Void&backgroundColor=90caf9' }
];

interface CustomAvatarConfig {
  gender: 'boy' | 'girl';
  skinColor: string;
  eyes: string;
  eyebrows: string;
  mouth: string;
  hair: string;
  hairColor: string;
  backgroundColor: string;
  glasses: string;
  features: string;
  earrings: string;
}

const DEFAULT_CUSTOM_AVATAR: CustomAvatarConfig = {
  gender: 'boy',
  skinColor: 'f8d9b6',
  eyes: 'variant01',
  eyebrows: 'variant01',
  mouth: 'variant01',
  hair: 'short01',
  hairColor: '2c1b18',
  backgroundColor: 'b6e3f4',
  glasses: 'none',
  features: 'none',
  earrings: 'none',
};

const SKIN_TONES = [
  { name: 'Fair', hex: 'f8d9b6' },
  { name: 'Warm', hex: 'e5a65d' },
  { name: 'Peach', hex: 'fcf0e3' },
  { name: 'Bronze', hex: 'd08b5b' },
  { name: 'Dark', hex: '9f5c3c' }
];

const HAIR_COLORS = [
  { name: 'Black', hex: '2c1b18' },
  { name: 'Brown', hex: '4a3728' },
  { name: 'Chestnut', hex: 'b86239' },
  { name: 'Blonde', hex: 'e9b86d' },
  { name: 'Ginger', hex: 'a55d24' },
  { name: 'Pink', hex: 'ff4081' },
  { name: 'Blue', hex: '0070f3' }
];

const BACKGROUND_COLORS = [
  { name: 'Sky Blue', hex: 'b6e3f4' },
  { name: 'Lavender', hex: 'c0b2f0' },
  { name: 'Butter', hex: 'ffe082' },
  { name: 'Mint', hex: 'a5d6a7' },
  { name: 'Peach', hex: 'ffcc80' },
  { name: 'Rose', hex: 'ef9a9a' },
  { name: 'Stealth', hex: 'b0bec5' }
];

const EYE_VARIANTS = ['variant01', 'variant02', 'variant03', 'variant04', 'variant05', 'variant06', 'variant07', 'variant08', 'variant09', 'variant10'];
const EYEBROW_VARIANTS = ['variant01', 'variant02', 'variant03', 'variant04', 'variant05', 'variant06', 'variant07', 'variant08', 'variant09', 'variant10'];
const MOUTH_VARIANTS = ['variant01', 'variant02', 'variant03', 'variant04', 'variant05', 'variant06', 'variant07', 'variant08', 'variant09', 'variant10'];
const GLASSES_VARIANTS = ['none', 'variant01', 'variant02', 'variant03', 'variant04', 'variant05'];
const FEATURES_VARIANTS = ['none', 'blush', 'freckles', 'blush,freckles', 'birthmark'];
const EARRINGS_VARIANTS = ['none', 'variant01', 'variant02', 'variant03', 'variant04', 'variant05'];

const BOY_HAIR = ['short01', 'short02', 'short03', 'short04', 'short05', 'short06', 'short07', 'short08', 'short09', 'short10', 'short11', 'short12', 'short13', 'short14', 'short15'];
const GIRL_HAIR = ['long01', 'long02', 'long03', 'long04', 'long05', 'long06', 'long07', 'long08', 'long09', 'long10', 'long11', 'long12', 'long13', 'long14', 'long15'];

const getCustomAvatarUrl = (config: CustomAvatarConfig) => {
  const params = new URLSearchParams({
    skinColor: config.skinColor,
    eyes: config.eyes,
    eyebrows: config.eyebrows,
    mouth: config.mouth,
    hair: config.hair,
    hairColor: config.hairColor,
    backgroundColor: config.backgroundColor,
  });
  
  if (config.glasses !== 'none') {
    params.set('glasses', config.glasses);
    params.set('glassesProbability', '100');
  } else {
    params.set('glassesProbability', '0');
  }

  if (config.features !== 'none') {
    params.set('features', config.features);
    params.set('featuresProbability', '100');
  } else {
    params.set('featuresProbability', '0');
  }

  if (config.earrings !== 'none') {
    params.set('earrings', config.earrings);
    params.set('earringsProbability', '100');
  } else {
    params.set('earringsProbability', '0');
  }

  return `https://api.dicebear.com/7.x/adventurer/svg?${params.toString()}`;
};

const PROFILE_KEY = 'patternlab_profile';

const loadProfile = (): ProfileData => {
  try {
    const stored = localStorage.getItem(PROFILE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        displayName: '',
        bio: '',
        location: '',
        website: '',
        github: '',
        linkedin: '',
        avatarUrl: '',
        username: '',
        usernameChangesRemaining: 1,
        ...parsed
      };
    }
  } catch { }
  return {
    displayName: '',
    bio: '',
    location: '',
    website: '',
    github: '',
    linkedin: '',
    avatarUrl: '',
    username: '',
    usernameChangesRemaining: 1
  };
};

export const ProfilePage: React.FC = () => {
  const { currentStreak, points, topics, solvedProblems, mockPopulate } = useProgressStore();
  const { user, setUser } = useUserStore();
  const [isLoaded, setIsLoaded] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [profile, setProfile] = useState<ProfileData>(loadProfile);
  const [editDraft, setEditDraft] = useState<ProfileData>(profile);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'codebuddy'>('overview');
  const { stats: cbStats } = useCodeBuddyStore();

  // Avatar selector & AI generation states
  const [modalTab, setModalTab] = useState<'details' | 'avatar'>('details');
  const [avatarMode, setAvatarMode] = useState<'presets' | 'studio' | 'ai'>('presets');
  const [studioConfig, setStudioConfig] = useState<CustomAvatarConfig>(DEFAULT_CUSTOM_AVATAR);
  const [studioLoading, setStudioLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [genStatusText, setGenStatusText] = useState('');

  useEffect(() => {
    setStudioLoading(true);
  }, [studioConfig]);

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

  useEffect(() => {
    if (!generating) return;
    const phrases = [
      "Synthesizing holographic grid...",
      "Calibrating neural generators...",
      "Structuring 3D mesh elements...",
      "Injecting cybernetic shader passes...",
      "Polishing glossy octane textures...",
      "Optimizing lighting systems...",
      "Finalizing high-fidelity render..."
    ];
    let i = 0;
    setGenStatusText(phrases[0]);
    const interval = setInterval(() => {
      i = (i + 1) % phrases.length;
      setGenStatusText(phrases[i]);
    }, 1500);
    return () => clearInterval(interval);
  }, [generating]);

  const handleGenerateAI = () => {
    if (!aiPrompt.trim()) return;
    setGenerating(true);
    setGeneratedUrl('');
    
    const seed = Math.floor(Math.random() * 1000000);
    const enhancedPrompt = encodeURIComponent(
      aiPrompt.trim() + ", glossy 3D avatar, cyberpunk tech style, neon lighting, dark sleek background, octane render, 8k, masterwork, high detail"
    );
    const newUrl = `https://image.pollinations.ai/p/${enhancedPrompt}?width=300&height=300&nologo=true&seed=${seed}`;
    
    setGeneratedUrl(newUrl);
  };

  const handleSave = () => {
    let finalDraft = { ...editDraft };
    if (editDraft.username !== profile.username && (profile.usernameChangesRemaining ?? 1) > 0) {
      finalDraft.usernameChangesRemaining = 0;
    }
    setProfile(finalDraft);
    setEditDraft(finalDraft);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(finalDraft));
    if (user) {
      setUser({ ...user });
    }
    setSaved(true);
    setTimeout(() => { setSaved(false); setShowEditModal(false); }, 1000);
  };

  const totalProblemsSolved = solvedProblems.length;
  const topicsMastered = Object.values(topics).filter(t => t.fullyCompleted).length;
  const totalTopics = Object.keys(topics).length;
  const avatarUrl = profile.avatarUrl || user?.user_metadata?.avatar_url;
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
            <div 
              className="relative group cursor-pointer animate-in zoom-in-95 duration-500 shrink-0"
              onClick={() => { setEditDraft({ ...profile, avatarUrl: profile.avatarUrl || user?.user_metadata?.avatar_url }); setModalTab('avatar'); setShowEditModal(true); }}
            >
              <div className="w-40 h-40 rounded-3xl ring-8 ring-background bg-gradient-to-br from-violet-600 to-blue-600 p-1 shadow-2xl transition-all duration-500 group-hover:scale-[1.03] group-hover:shadow-violet-500/25">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="w-full h-full rounded-[22px] object-cover" />
                ) : (
                  <div className="w-full h-full rounded-[22px] bg-surface flex items-center justify-center text-5xl font-black text-violet-500">
                    {avatarChar}
                  </div>
                )}
                {/* Hover overlay edit button */}
                <div className="absolute inset-1 rounded-[22px] bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1.5 transition-all duration-300 backdrop-blur-[2px]">
                  <Edit2 size={20} className="text-white animate-bounce" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-white/90">Change Photo</span>
                </div>
              </div>
              <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-green-500 border-4 border-background shadow-lg" />
            </div>

            {/* Identity Info */}
            <div className="flex-1 pb-2">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-baseline gap-2.5">
                    <h1 className="text-4xl font-black tracking-tight text-white">{displayName}</h1>
                    {profile.username && (
                      <span className="text-[10px] font-black text-violet-400 bg-violet-600/10 px-2 py-0.5 border border-violet-500/20 rounded-lg tracking-wider uppercase">
                        @{profile.username}
                      </span>
                    )}
                  </div>
                  <p className="text-violet-300/60 font-medium flex items-center gap-2 mt-1">
                    <AtSign size={14} /> {user?.email}
                  </p>
                </div>
                <button
                  onClick={() => { setEditDraft({ ...profile, avatarUrl: profile.avatarUrl || user?.user_metadata?.avatar_url }); setModalTab('details'); setShowEditModal(true); }}
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
                {profile.linkedin && (
                  <a href={`https://linkedin.com/in/${profile.linkedin}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-500 shrink-0">
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                      <rect width="4" height="12" x="2" y="9"/>
                      <circle cx="4" cy="4" r="2"/>
                    </svg>
                    in/{profile.linkedin}
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
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'codebuddy', label: 'CodeBuddy Stats', icon: Users },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-4 px-1 text-sm font-bold transition-all relative ${activeTab === tab.id ? 'text-violet-400' : 'text-muted hover:text-primary'
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


        {activeTab === 'codebuddy' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Cumulative Battle Points', value: `${cbStats.points} pts`, icon: Swords, color: 'text-accent', bg: 'bg-accent/10' },
                { label: 'Win Ratio (W/L)', value: `${Math.round((cbStats.wins / Math.max(1, cbStats.totalMatches)) * 100)}% (${cbStats.wins}W / ${cbStats.losses}L)`, icon: Trophy, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                { label: 'Win Streak', value: `${cbStats.winStreak} Matches`, icon: Flame, color: 'text-orange-400', bg: 'bg-orange-500/10' },
                { label: 'Total Matches', value: `${cbStats.totalMatches} Battles`, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
              ].map(s => (
                <div key={s.label} className="bg-surface border border-border rounded-2xl p-5 flex items-center gap-4 group hover:border-accent/30 transition-all">
                  <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center ${s.color} shrink-0 group-hover:scale-110 transition-transform`}>
                    <s.icon size={24} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-muted uppercase tracking-widest">{s.label}</div>
                    <div className="text-xl font-black text-primary mt-1">{s.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Split Details Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

              {/* Left Column: Behavioral Stats */}
              <div className="lg:col-span-8 bg-surface border border-border rounded-3xl p-6 text-left">
                <h3 className="text-lg font-black text-white mb-6">Social Coding Behavior</h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-background border border-border p-4 rounded-2xl text-sm">
                    <span className="text-muted">Strongest Battle Pattern</span>
                    <span className="font-bold text-emerald-400">{cbStats.strongestTopic}</span>
                  </div>

                  <div className="flex justify-between items-center bg-background border border-border p-4 rounded-2xl text-sm">
                    <span className="text-muted">Weakest Battle Pattern</span>
                    <span className="font-bold text-rose-400">{cbStats.weakestTopic}</span>
                  </div>

                  <div className="flex justify-between items-center bg-background border border-border p-4 rounded-2xl text-sm">
                    <span className="text-muted">Average Solve Speed</span>
                    <span className="font-mono font-bold text-white">
                      {Math.floor(cbStats.averageSpeed / 60)}m {cbStats.averageSpeed % 60}s
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-background border border-border p-4 rounded-2xl text-sm">
                    <span className="text-muted">Global Topic Leaderboard Placement</span>
                    <span className="font-bold text-accent">Top 8% in Sliding Window battles</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Optimization Gauge */}
              <div className="lg:col-span-4 bg-surface border border-border rounded-3xl p-6 flex flex-col items-center justify-center text-center">
                <div className="text-[10px] font-black text-muted uppercase tracking-widest font-mono mb-4">OPTIMIZATION GAUGE</div>

                <div className="w-32 h-32 rounded-full border-4 border-accent/20 flex items-center justify-center relative mb-4 shadow-[0_0_30px_rgba(124,111,247,0.05)]">
                  {/* Glowing core */}
                  <div className="absolute inset-2 rounded-full border border-accent/40 bg-accent/5 flex items-center justify-center flex-col">
                    <span className="text-2xl font-black text-white font-mono">{cbStats.optimizationRating}%</span>
                    <span className="text-[9px] text-accent uppercase font-bold tracking-widest font-mono mt-0.5">Rating</span>
                  </div>
                </div>

                <p className="text-xs text-muted max-w-[200px] leading-relaxed">
                  Weighted battle efficiency calculated dynamically from algorithmic complexity, runtime speed, quality checks, and edge-case coverages.
                </p>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setShowEditModal(false)} />
          <div className="relative z-10 bg-surface border border-border rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="flex items-center justify-between px-8 py-5 border-b border-border bg-background/50">
              <div>
                <h2 className="font-black text-primary text-lg">Edit Profile</h2>
                <p className="text-[10px] text-muted font-bold uppercase tracking-wider mt-0.5">Customize your identity</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-muted hover:text-white transition-colors p-2 rounded-xl hover:bg-white/5 animate-all duration-300">
                <X size={20} />
              </button>
            </div>

            {/* Modal Tabs Selector */}
            <div className="flex border-b border-border bg-background/20 p-2 gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setModalTab('details')}
                className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all border ${
                  modalTab === 'details'
                    ? 'bg-violet-600/10 text-violet-400 border-violet-500/20 shadow-[0_0_15px_rgba(124,58,237,0.08)]'
                    : 'text-muted hover:text-white hover:bg-white/5 border-transparent'
                }`}
              >
                Profile Details
              </button>
              <button
                type="button"
                onClick={() => setModalTab('avatar')}
                className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all border ${
                  modalTab === 'avatar'
                    ? 'bg-violet-600/10 text-violet-400 border-violet-500/20 shadow-[0_0_15px_rgba(124,58,237,0.08)]'
                    : 'text-muted hover:text-white hover:bg-white/5 border-transparent'
                }`}
              >
                Choose Photo
              </button>
            </div>

            <div className="px-8 py-6 space-y-5 overflow-y-auto max-h-[60vh] custom-scrollbar flex-1">
              {modalTab === 'details' ? (
                <div className="grid grid-cols-1 gap-5 animate-in fade-in duration-200">
                  <div>
                    <label className="text-xs font-black text-muted uppercase tracking-widest block mb-2 text-violet-400">Public Identity</label>
                    <div className="space-y-4">
                      <div className="relative">
                        <input
                          value={editDraft.username || ''}
                          onChange={e => {
                            const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                            setEditDraft(d => ({ ...d, username: val }));
                          }}
                          placeholder="Unique Username Handle (e.g. coder_99)"
                          disabled={(profile.usernameChangesRemaining ?? 1) === 0}
                          className="w-full bg-background border border-border rounded-xl pl-4 pr-24 py-3 text-sm text-primary placeholder:text-muted/50 outline-none focus:border-violet-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none select-none">
                          {(profile.usernameChangesRemaining ?? 1) === 0 ? (
                            <span className="text-[9px] font-black uppercase tracking-wider text-muted/80 bg-white/5 border border-border px-2 py-0.5 rounded">🔒 Locked</span>
                          ) : (
                            <span className="text-[9px] font-black uppercase tracking-wider text-violet-400 bg-violet-600/10 border border-violet-500/20 px-2 py-0.5 rounded">⚡ 1 Edit Left</span>
                          )}
                        </div>
                      </div>
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
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-4 top-1/2 -translate-y-1/2 text-muted shrink-0">
                          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                          <rect width="4" height="12" x="2" y="9"/>
                          <circle cx="4" cy="4" r="2"/>
                        </svg>
                        <input
                          value={editDraft.linkedin || ''}
                          onChange={e => setEditDraft(d => ({ ...d, linkedin: e.target.value }))}
                          placeholder="LinkedIn Profile Name"
                          className="w-full bg-background border border-border rounded-xl pl-12 pr-4 py-3 text-sm text-primary outline-none focus:border-violet-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-5 animate-in fade-in duration-200">
                  {/* Current Avatar Preview */}
                  <div className="flex items-center gap-4 bg-background/30 border border-border/50 p-4 rounded-2xl">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 p-0.5 shadow-lg shrink-0">
                      {editDraft.avatarUrl ? (
                        <img src={editDraft.avatarUrl} alt="Preview" className="w-full h-full rounded-[14px] object-cover" />
                      ) : (
                        <div className="w-full h-full rounded-[14px] bg-surface flex items-center justify-center text-2xl font-black text-violet-500">
                          {avatarChar}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white">Profile Photo</h3>
                      <p className="text-[11px] text-muted mt-0.5">Select a pre-designed avatar below or generate a custom AI character.</p>
                    </div>
                  </div>

                  {/* Mode Selector Navigation */}
                  <div className="flex gap-1.5 p-1 bg-background/50 border border-border rounded-xl">
                    <button
                      type="button"
                      onClick={() => setAvatarMode('presets')}
                      className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                        avatarMode === 'presets'
                          ? 'bg-violet-600/10 text-violet-400'
                          : 'text-muted hover:text-white hover:bg-white/5'
                      }`}
                    >
                      Curated Pixels
                    </button>
                    <button
                      type="button"
                      onClick={() => setAvatarMode('studio')}
                      className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                        avatarMode === 'studio'
                          ? 'bg-violet-600/10 text-violet-400'
                          : 'text-muted hover:text-white hover:bg-white/5'
                      }`}
                    >
                      Avatar Studio (Ghibli)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAvatarMode('ai')}
                      className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                        avatarMode === 'ai'
                          ? 'bg-violet-600/10 text-violet-400'
                          : 'text-muted hover:text-white hover:bg-white/5'
                      }`}
                    >
                      AI Generator
                    </button>
                  </div>

                  {avatarMode === 'presets' && (
                    <div className="space-y-3 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-muted uppercase tracking-widest text-violet-400">Curated Avatars</label>
                        <span className="text-[9px] font-mono text-violet-300/40">20 classy techy options</span>
                      </div>

                      {/* Unified Grid */}
                      <div className="grid grid-cols-4 gap-2.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                        {AVATARS.map(avatar => {
                          const isSelected = editDraft.avatarUrl === avatar.url;
                          return (
                            <button
                              key={avatar.id}
                              type="button"
                              onClick={() => setEditDraft(d => ({ ...d, avatarUrl: avatar.url }))}
                              className={`relative aspect-square rounded-2xl p-0.5 overflow-hidden transition-all duration-300 hover:scale-105 ${
                                isSelected
                                  ? 'ring-2 ring-violet-500 bg-gradient-to-br from-violet-500 to-blue-500 shadow-lg shadow-violet-500/25'
                                  : 'bg-border/30 hover:bg-border/60 border border-border/20'
                              }`}
                            >
                              <img src={avatar.url} alt={avatar.name} className="w-full h-full rounded-[14px] object-cover bg-surface" />
                              {isSelected && (
                                <div className="absolute inset-0 bg-violet-600/30 backdrop-blur-[1px] flex items-center justify-center rounded-[14px]">
                                  <Check className="text-white drop-shadow-md" size={16} strokeWidth={4} />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {avatarMode === 'studio' && (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-in fade-in duration-200">
                      {/* Left: Studio Live Preview */}
                      <div className="md:col-span-4 flex flex-col items-center justify-center bg-background/25 border border-border/60 p-5 rounded-2xl space-y-4">
                        <div className="relative w-32 h-32 rounded-2xl overflow-hidden ring-4 ring-violet-500/30 p-0.5 shadow-xl bg-surface flex items-center justify-center">
                          <img
                            src={getCustomAvatarUrl(studioConfig)}
                            alt="Studio Custom Avatar"
                            className="w-full h-full object-cover rounded-xl"
                            onLoad={() => setStudioLoading(false)}
                            onError={() => setStudioLoading(false)}
                          />
                          {studioLoading && (
                            <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center text-center p-2 rounded-xl">
                              <Loader2 className="animate-spin text-violet-400 mb-1" size={18} />
                              <span className="text-[7px] font-mono text-violet-300 font-bold uppercase tracking-widest animate-pulse">
                                Re-rendering...
                              </span>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const finalUrl = getCustomAvatarUrl(studioConfig);
                            setEditDraft(d => ({ ...d, avatarUrl: finalUrl }));
                          }}
                          className="w-full bg-violet-600 hover:bg-violet-500 text-white rounded-xl py-2 text-xs font-black uppercase tracking-wider transition-all active:scale-95 shadow-md shadow-violet-500/10"
                        >
                          Use Custom Avatar
                        </button>
                      </div>

                      {/* Right: Studio Customizer Controls */}
                      <div className="md:col-span-8 space-y-4 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                        {/* Gender Base */}
                        <div>
                          <label className="text-[9px] font-black text-muted uppercase tracking-widest text-violet-400 block mb-1.5">Gender base</label>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setStudioConfig(c => ({ ...c, gender: 'boy', hair: 'short01' }))}
                              className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all border ${
                                studioConfig.gender === 'boy'
                                  ? 'bg-violet-600/10 text-violet-400 border-violet-500/20'
                                  : 'text-muted border-transparent hover:text-white hover:bg-white/5'
                              }`}
                            >
                              👦 Boy Base
                            </button>
                            <button
                              type="button"
                              onClick={() => setStudioConfig(c => ({ ...c, gender: 'girl', hair: 'long01' }))}
                              className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all border ${
                                studioConfig.gender === 'girl'
                                  ? 'bg-violet-600/10 text-violet-400 border-violet-500/20'
                                  : 'text-muted border-transparent hover:text-white hover:bg-white/5'
                              }`}
                            >
                              👧 Girl Base
                            </button>
                          </div>
                        </div>

                        {/* Skin Tone */}
                        <div>
                          <label className="text-[9px] font-black text-muted uppercase tracking-widest text-violet-400 block mb-1.5">Skintone</label>
                          <div className="flex flex-wrap gap-2">
                            {SKIN_TONES.map(skin => (
                              <button
                                key={skin.hex}
                                type="button"
                                onClick={() => setStudioConfig(c => ({ ...c, skinColor: skin.hex }))}
                                className={`w-6 h-6 rounded-full border transition-all ${
                                  studioConfig.skinColor === skin.hex
                                    ? 'ring-2 ring-violet-500 border-white'
                                    : 'border-transparent hover:scale-105'
                                }`}
                                style={{ backgroundColor: `#${skin.hex}` }}
                                title={skin.name}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Hair Style Selection */}
                        <div>
                          <label className="text-[9px] font-black text-muted uppercase tracking-widest text-violet-400 block mb-1.5">Hairstyle</label>
                          <div className="flex gap-1.5 overflow-x-auto pb-1.5 custom-scrollbar">
                            {(studioConfig.gender === 'boy' ? BOY_HAIR : GIRL_HAIR).map(hairStyle => {
                              const isSelected = studioConfig.hair === hairStyle;
                              return (
                                <button
                                  key={hairStyle}
                                  type="button"
                                  onClick={() => setStudioConfig(c => ({ ...c, hair: hairStyle }))}
                                  className={`px-3 py-1.5 text-[9px] font-black rounded-lg transition-all shrink-0 uppercase border ${
                                    isSelected
                                      ? 'bg-violet-600/10 text-violet-400 border-violet-500/20'
                                      : 'bg-background hover:bg-white/5 border-border/40 text-muted'
                                  }`}
                                >
                                  Style {hairStyle.replace('short', '').replace('long', '')}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Hair Color */}
                        <div>
                          <label className="text-[9px] font-black text-muted uppercase tracking-widest text-violet-400 block mb-1.5">Hair Colour</label>
                          <div className="flex flex-wrap gap-2">
                            {HAIR_COLORS.map(color => (
                              <button
                                key={color.hex}
                                type="button"
                                onClick={() => setStudioConfig(c => ({ ...c, hairColor: color.hex }))}
                                className={`w-6 h-6 rounded-full border transition-all ${
                                  studioConfig.hairColor === color.hex
                                    ? 'ring-2 ring-violet-500 border-white'
                                    : 'border-transparent hover:scale-105'
                                }`}
                                style={{ backgroundColor: `#${color.hex}` }}
                                title={color.name}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Eyes */}
                        <div>
                          <label className="text-[9px] font-black text-muted uppercase tracking-widest text-violet-400 block mb-1.5">Eye Shape</label>
                          <div className="flex gap-1.5 overflow-x-auto pb-1.5 custom-scrollbar">
                            {EYE_VARIANTS.map(eye => {
                              const isSelected = studioConfig.eyes === eye;
                              return (
                                <button
                                  key={eye}
                                  type="button"
                                  onClick={() => setStudioConfig(c => ({ ...c, eyes: eye }))}
                                  className={`px-3 py-1.5 text-[9px] font-black rounded-lg transition-all shrink-0 uppercase border ${
                                    isSelected
                                      ? 'bg-violet-600/10 text-violet-400 border-violet-500/20'
                                      : 'bg-background hover:bg-white/5 border-border/40 text-muted'
                                  }`}
                                >
                                  Shape {eye.replace('variant', '')}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Eyebrows */}
                        <div>
                          <label className="text-[9px] font-black text-muted uppercase tracking-widest text-violet-400 block mb-1.5">Eyebrow Shape</label>
                          <div className="flex gap-1.5 overflow-x-auto pb-1.5 custom-scrollbar">
                            {EYEBROW_VARIANTS.map(eyebrow => {
                              const isSelected = studioConfig.eyebrows === eyebrow;
                              return (
                                <button
                                  key={eyebrow}
                                  type="button"
                                  onClick={() => setStudioConfig(c => ({ ...c, eyebrows: eyebrow }))}
                                  className={`px-3 py-1.5 text-[9px] font-black rounded-lg transition-all shrink-0 uppercase border ${
                                    isSelected
                                      ? 'bg-violet-600/10 text-violet-400 border-violet-500/20'
                                      : 'bg-background hover:bg-white/5 border-border/40 text-muted'
                                  }`}
                                >
                                  Shape {eyebrow.replace('variant', '')}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Mouth */}
                        <div>
                          <label className="text-[9px] font-black text-muted uppercase tracking-widest text-violet-400 block mb-1.5">Mouth Shape</label>
                          <div className="flex gap-1.5 overflow-x-auto pb-1.5 custom-scrollbar">
                            {MOUTH_VARIANTS.map(mouth => {
                              const isSelected = studioConfig.mouth === mouth;
                              return (
                                <button
                                  key={mouth}
                                  type="button"
                                  onClick={() => setStudioConfig(c => ({ ...c, mouth }))}
                                  className={`px-3 py-1.5 text-[9px] font-black rounded-lg transition-all shrink-0 uppercase border ${
                                    isSelected
                                      ? 'bg-violet-600/10 text-violet-400 border-violet-500/20'
                                      : 'bg-background hover:bg-white/5 border-border/40 text-muted'
                                  }`}
                                >
                                  Mouth {mouth.replace('variant', '')}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Glasses */}
                        <div>
                          <label className="text-[9px] font-black text-muted uppercase tracking-widest text-violet-400 block mb-1.5">Glasses accessory</label>
                          <div className="flex gap-1.5 overflow-x-auto pb-1.5 custom-scrollbar">
                            {GLASSES_VARIANTS.map(glasses => {
                              const isSelected = studioConfig.glasses === glasses;
                              return (
                                <button
                                  key={glasses}
                                  type="button"
                                  onClick={() => setStudioConfig(c => ({ ...c, glasses }))}
                                  className={`px-3 py-1.5 text-[9px] font-black rounded-lg transition-all shrink-0 uppercase border ${
                                    isSelected
                                      ? 'bg-violet-600/10 text-violet-400 border-violet-500/20'
                                      : 'bg-background hover:bg-white/5 border-border/40 text-muted'
                                  }`}
                                >
                                  {glasses === 'none' ? 'None' : `Glasses ${glasses.replace('variant', '')}`}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Features (Cute Blush / Freckles) */}
                        <div>
                          <label className="text-[9px] font-black text-muted uppercase tracking-widest text-violet-400 block mb-1.5">Facial Details (Ghibli Blush)</label>
                          <div className="flex gap-1.5 overflow-x-auto pb-1.5 custom-scrollbar">
                            {FEATURES_VARIANTS.map(feat => {
                              const isSelected = studioConfig.features === feat;
                              return (
                                <button
                                  key={feat}
                                  type="button"
                                  onClick={() => setStudioConfig(c => ({ ...c, features: feat }))}
                                  className={`px-3 py-1.5 text-[9px] font-black rounded-lg transition-all shrink-0 uppercase border ${
                                    isSelected
                                      ? 'bg-violet-600/10 text-violet-400 border-violet-500/20'
                                      : 'bg-background hover:bg-white/5 border-border/40 text-muted'
                                  }`}
                                >
                                  {feat === 'none' ? 'None' : feat.replace(',', ' & ')}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Earrings */}
                        <div>
                          <label className="text-[9px] font-black text-muted uppercase tracking-widest text-violet-400 block mb-1.5">Earring Accessory</label>
                          <div className="flex gap-1.5 overflow-x-auto pb-1.5 custom-scrollbar">
                            {EARRINGS_VARIANTS.map(ear => {
                              const isSelected = studioConfig.earrings === ear;
                              return (
                                <button
                                  key={ear}
                                  type="button"
                                  onClick={() => setStudioConfig(c => ({ ...c, earrings: ear }))}
                                  className={`px-3 py-1.5 text-[9px] font-black rounded-lg transition-all shrink-0 uppercase border ${
                                    isSelected
                                      ? 'bg-violet-600/10 text-violet-400 border-violet-500/20'
                                      : 'bg-background hover:bg-white/5 border-border/40 text-muted'
                                  }`}
                                >
                                  {ear === 'none' ? 'None' : `Earring ${ear.replace('variant', '')}`}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Background Color */}
                        <div>
                          <label className="text-[9px] font-black text-muted uppercase tracking-widest text-violet-400 block mb-1.5">Background color</label>
                          <div className="flex flex-wrap gap-2">
                            {BACKGROUND_COLORS.map(bg => (
                              <button
                                key={bg.hex}
                                type="button"
                                onClick={() => setStudioConfig(c => ({ ...c, backgroundColor: bg.hex }))}
                                className={`w-6 h-6 rounded-full border transition-all ${
                                  studioConfig.backgroundColor === bg.hex
                                    ? 'ring-2 ring-violet-500 border-white'
                                    : 'border-transparent hover:scale-105'
                                }`}
                                style={{ backgroundColor: `#${bg.hex}` }}
                                title={bg.name}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {avatarMode === 'ai' && (
                    <div className="bg-background/25 border border-border/60 rounded-2xl p-4 space-y-4 animate-in fade-in duration-200">
                      <div className="flex items-center gap-2">
                        <Sparkles className="text-violet-400 shrink-0" size={16} />
                        <div>
                          <h4 className="text-xs font-black text-white uppercase tracking-wider">AI Character Generator</h4>
                          <p className="text-[10px] text-muted leading-relaxed">Describe a character to render a unique glossy 3D avatar.</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <input
                          value={aiPrompt}
                          onChange={e => setAiPrompt(e.target.value)}
                          placeholder="Describe character e.g. holographic space panda..."
                          disabled={generating}
                          className="flex-1 bg-background border border-border rounded-xl px-4 py-2 text-xs text-primary placeholder:text-muted/50 outline-none focus:border-violet-500 transition-colors disabled:opacity-50"
                        />
                        <button
                          type="button"
                          onClick={handleGenerateAI}
                          disabled={generating || !aiPrompt.trim()}
                          className="bg-violet-600 hover:bg-violet-500 text-white rounded-xl px-4 py-2 text-xs font-black transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50 active:scale-95 shadow-md shadow-violet-500/10"
                        >
                          {generating ? (
                            <Loader2 className="animate-spin" size={12} />
                          ) : (
                            <Wand2 size={12} />
                          )}
                          Generate
                        </button>
                      </div>

                      {/* Generator States: Loading & Preview */}
                      {generating && (
                        <div className="flex flex-col items-center justify-center py-6 border border-dashed border-violet-500/20 rounded-xl bg-violet-950/5">
                          <div className="w-8 h-8 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin mb-3" />
                          <span className="text-[9px] font-mono text-violet-400 font-bold uppercase tracking-wider animate-pulse text-center px-4">
                            {genStatusText}
                          </span>
                        </div>
                      )}

                      {generatedUrl && (
                        <div className="flex flex-col sm:flex-row items-center gap-4 bg-background/45 border border-violet-500/20 p-3 rounded-xl animate-in zoom-in-95 duration-200">
                          <div className="w-16 h-16 rounded-xl overflow-hidden ring-2 ring-violet-500 shrink-0 shadow-lg shadow-violet-500/10 relative bg-surface">
                            <img 
                              src={generatedUrl} 
                              alt="AI Generated" 
                              className="w-full h-full object-cover" 
                              onLoad={() => setGenerating(false)}
                              onError={() => setGenerating(false)}
                            />
                            {generating && (
                              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                <div className="w-4 h-4 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 text-center sm:text-left space-y-1.5">
                            <div className="text-[10px] text-emerald-400 font-black uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1">
                              {generating ? (
                                <span className="text-violet-400 animate-pulse">Rendering in background...</span>
                              ) : (
                                <>
                                  <Check size={12} strokeWidth={3} /> Render Complete!
                                </>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setEditDraft(d => ({ ...d, avatarUrl: generatedUrl }));
                                setGeneratedUrl('');
                                setAiPrompt('');
                              }}
                              disabled={generating}
                              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-3 py-1.5 text-[9px] font-black uppercase tracking-wider transition-all disabled:opacity-50"
                            >
                              Use this Avatar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-8 py-5 border-t border-border bg-background/50 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-6 py-2.5 text-sm font-bold text-muted hover:text-white transition-colors"
              >
                Discard
              </button>
              <button
                type="button"
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
