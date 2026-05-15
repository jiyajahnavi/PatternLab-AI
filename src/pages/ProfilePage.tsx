import React, { useEffect, useState } from 'react';
import {
  Calendar, MapPin, Link as LinkIcon, Edit2, Loader2,
  Flame, Trophy, X, Save, Check,
  BookOpen, Code2, Zap, AtSign, GitBranch
} from 'lucide-react';
import { HeatmapCalendar } from '../components/profile/HeatmapCalendar';
import { LevelBreakdownChart } from '../components/profile/LevelBreakdownChart';
import { TopicMasteryGrid } from '../components/profile/TopicMasteryGrid';
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

  useEffect(() => {
    if (Object.keys(topics).length === 0 || topics['arrays']?.level1.total === 0) {
      mockPopulate();
    }
    setIsLoaded(true);
  }, [topics, mockPopulate]);

  // Pre-fill from Google account if profile is empty
  useEffect(() => {
    if (user && !profile.displayName) {
      const googleName = user.user_metadata?.full_name || user.email?.split('@')[0] || '';
      setProfile(p => ({ ...p, displayName: googleName }));
      setEditDraft(p => ({ ...p, displayName: googleName }));
    }
  }, [user]);

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
    <div className="h-full overflow-y-auto bg-background text-primary">
      {/* Banner */}
      <div className="h-32 bg-gradient-to-r from-accent/30 via-purple-700/20 to-blue-700/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(124,111,247,0.15),transparent_70%)]" />
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(rgba(124,111,247,1) 1px, transparent 1px), linear-gradient(90deg, rgba(124,111,247,1) 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 -mt-16 pb-12 space-y-6">

        {/* Profile Card */}
        <div className="bg-surface border border-border rounded-2xl p-6 relative overflow-hidden shadow-xl shadow-black/30">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 rounded-2xl ring-4 ring-background bg-gradient-to-br from-accent to-blue-600 p-0.5 shadow-lg">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="w-full h-full rounded-[14px] object-cover" />
                ) : (
                  <div className="w-full h-full rounded-[14px] bg-surface flex items-center justify-center text-3xl font-bold text-accent">
                    {avatarChar}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-background" title="Online" />
            </div>

            <div className="flex-1 pt-1">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                <div>
                  <h1 className="text-2xl font-bold text-primary">{displayName}</h1>
                  {user?.email && <p className="text-xs text-muted mt-0.5">{user.email}</p>}
                </div>
                <button
                  onClick={() => { setEditDraft(profile); setShowEditModal(true); }}
                  className="flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-primary transition-colors border border-border hover:border-accent/50 bg-background px-3 py-1.5 rounded-lg"
                >
                  <Edit2 size={12} /> Edit Profile
                </button>
              </div>

              <p className="text-muted text-sm mb-3 max-w-lg">
                {profile.bio || '"Mastering patterns, one algorithm at a time."'}
              </p>

              <div className="flex flex-wrap gap-4 text-xs text-muted">
                {profile.location && (
                  <div className="flex items-center gap-1.5"><MapPin size={12} />{profile.location}</div>
                )}
                <div className="flex items-center gap-1.5"><Calendar size={12} />Joined {joinDate}</div>
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-accent transition-colors">
                    <LinkIcon size={12} />{profile.website.replace(/https?:\/\//, '')}
                  </a>
                )}
                {profile.github && (
                  <a href={`https://github.com/${profile.github}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-accent transition-colors">
                    <GitBranch size={12} />@{profile.github}
                  </a>
                )}
                {profile.twitter && (
                  <a href={`https://twitter.com/${profile.twitter}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-accent transition-colors">
                    <AtSign size={12} />@{profile.twitter}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border/50">
            <div className="bg-background/60 rounded-xl p-4 border border-border/50 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-muted text-xs font-medium"><Code2 size={13} /> Problems Solved</div>
              <div className="text-2xl font-bold font-mono text-primary">{totalProblemsSolved}</div>
            </div>
            <div className="bg-background/60 rounded-xl p-4 border border-border/50 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-muted text-xs font-medium"><Trophy size={13} className="text-yellow-500" /> Topics Mastered</div>
              <div className="text-2xl font-bold font-mono text-yellow-500">{topicsMastered}<span className="text-sm font-sans text-muted">/{totalTopics}</span></div>
            </div>
            <div className="bg-background/60 rounded-xl p-4 border border-border/50 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-muted text-xs font-medium"><Flame size={13} className="text-orange-400" /> Current Streak</div>
              <div className="text-2xl font-bold font-mono text-orange-400">{currentStreak}<span className="text-sm font-sans text-muted"> days</span></div>
            </div>
            <div className="bg-background/60 rounded-xl p-4 border border-border/50 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-muted text-xs font-medium"><Zap size={13} className="text-accent" /> Total Points</div>
              <div className="text-2xl font-bold font-mono text-accent">{points.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Heatmap */}
        <HeatmapCalendar />

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <LevelBreakdownChart />
          <TopicMasteryGrid />
        </div>

        {/* Recent Activity placeholder */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={16} className="text-accent" />
            <h3 className="text-base font-bold text-primary">Community Solutions</h3>
          </div>
          <div className="h-28 flex flex-col items-center justify-center text-center text-muted border border-dashed border-border rounded-xl bg-background/40">
            <p className="text-sm">No solutions submitted publicly yet.</p>
            <p className="text-xs mt-1 text-muted/60">Submit a solution in the IDE to share it with the community.</p>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
          <div className="relative z-10 bg-surface border border-border rounded-2xl w-full max-w-md shadow-2xl shadow-black/50 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-bold text-primary text-base">Edit Profile</h2>
              <button onClick={() => setShowEditModal(false)} className="text-muted hover:text-primary transition-colors p-1 rounded hover:bg-background">
                <X size={16} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {/* Display Name */}
              <div>
                <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1.5">Display Name</label>
                <input
                  value={editDraft.displayName}
                  onChange={e => setEditDraft(d => ({ ...d, displayName: e.target.value }))}
                  placeholder="Your name"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-primary placeholder:text-muted/50 outline-none focus:border-accent transition-colors"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1.5">Bio</label>
                <textarea
                  value={editDraft.bio}
                  onChange={e => setEditDraft(d => ({ ...d, bio: e.target.value }))}
                  placeholder="A short bio about yourself..."
                  rows={3}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-primary placeholder:text-muted/50 outline-none focus:border-accent transition-colors resize-none"
                />
              </div>

              {/* Location */}
              <div>
                <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1.5">Location</label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    value={editDraft.location}
                    onChange={e => setEditDraft(d => ({ ...d, location: e.target.value }))}
                    placeholder="City, Country"
                    className="w-full bg-background border border-border rounded-lg pl-8 pr-3 py-2 text-sm text-primary placeholder:text-muted/50 outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>

              {/* Website */}
              <div>
                <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1.5">Website</label>
                <div className="relative">
                  <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    value={editDraft.website}
                    onChange={e => setEditDraft(d => ({ ...d, website: e.target.value }))}
                    placeholder="https://yoursite.com"
                    className="w-full bg-background border border-border rounded-lg pl-8 pr-3 py-2 text-sm text-primary placeholder:text-muted/50 outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>

              {/* GitHub */}
              <div>
                <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1.5">GitHub Username</label>
                <div className="relative">
                  <GitBranch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    value={editDraft.github}
                    onChange={e => setEditDraft(d => ({ ...d, github: e.target.value }))}
                    placeholder="username"
                    className="w-full bg-background border border-border rounded-lg pl-8 pr-3 py-2 text-sm text-primary placeholder:text-muted/50 outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>

              {/* Twitter */}
              <div>
                <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1.5">Twitter / X Username</label>
                <div className="relative">
                  <AtSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    value={editDraft.twitter}
                    onChange={e => setEditDraft(d => ({ ...d, twitter: e.target.value }))}
                    placeholder="username"
                    className="w-full bg-background border border-border rounded-lg pl-8 pr-3 py-2 text-sm text-primary placeholder:text-muted/50 outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border flex justify-end gap-2">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-xs font-semibold text-muted hover:text-primary border border-border rounded-lg hover:border-accent/30 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-xs font-semibold bg-accent text-background rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5"
              >
                {saved ? <><Check size={12} /> Saved!</> : <><Save size={12} /> Save Changes</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
