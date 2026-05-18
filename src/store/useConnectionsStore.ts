import { create } from 'zustand';
import { supabase } from '../services/supabaseClient';
import type { CodeBuddyStats } from './useCodeBuddyStore';
import type { BrainRating } from './useBrainStore';
import type { TopicProgress } from './useProgressStore';
import { useUserStore } from './useUserStore';
import { useBrainStore } from './useBrainStore';
import { useProgressStore } from './useProgressStore';
import { useCodeBuddyStore } from './useCodeBuddyStore';

export interface Connection {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  points: number;
  rank: string;
  strongestTopic: string;
  weakestTopic: string;
  online: boolean;
  bio?: string;
  location?: string;
  github?: string;
  twitter?: string;
  brainRating: BrainRating;
  solvedProblems: string[];
  stats: CodeBuddyStats;
  progress: Record<string, TopicProgress>;
}

export interface ConnectionRequest {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  points: number;
  rank: string;
  strongestTopic: string;
  weakestTopic: string;
  timestamp: string;
  bio?: string;
  location?: string;
  github?: string;
  twitter?: string;
  brainRating?: BrainRating;
  solvedProblems?: string[];
  stats?: CodeBuddyStats;
}

export interface ActivityItem {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  text: string;
  timestamp: string;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'connections' | 'private';
  activityVisibility: 'public' | 'connections' | 'private';
  comparePermissions: 'anyone' | 'connections' | 'only_me';
  battleInvites: 'anyone' | 'connections' | 'none';
  onlineStatus: 'visible' | 'invisible';
}

export interface UserConnectionState {
  connections: Connection[];
  pendingRequests: ConnectionRequest[];
  sentRequests: string[];
  activities: ActivityItem[];
}

interface ConnectionsState {
  connections: Connection[];
  pendingRequests: ConnectionRequest[];
  sentRequests: string[]; // usernames
  activities: ActivityItem[];
  privacySettings: PrivacySettings;
  inviteUsername: string;
  updateActiveUserData: (updater: (state: UserConnectionState) => Partial<UserConnectionState>) => void;
  
  initializeUsername: (emailOrName: string) => void;
  sendRequest: (username: string) => Promise<boolean>;
  acceptRequest: (requestId: string) => void;
  rejectRequest: (requestId: string) => void;
  removeConnection: (connectionId: string) => void;
  updatePrivacySettings: (settings: Partial<PrivacySettings>) => void;
  addActivity: (text: string) => void;
  seedMockData: () => void;
  subscribeToSync: () => () => void;
}

const CONNECTIONS_MOCK_KEY = 'patternlab_connections_seeded';

// Detailed mock progress generator to provide beautiful gauges in profile views
const generateMockProgress = (strong: string, weak: string): Record<string, TopicProgress> => {
  const topics = ['arrays', 'strings', 'binary-search', 'stack', 'queue', 'linked-list', 'hashmap', 'tree', 'graph', 'dp'];
  const record: Record<string, TopicProgress> = {};
  
  topics.forEach(t => {
    const isStrong = t === strong.toLowerCase() || (strong === 'DP' && t === 'dp');
    const isWeak = t === weak.toLowerCase();
    
    const l1Solved = isStrong ? 4 : isWeak ? 0 : Math.floor(Math.random() * 3);
    const l2Solved = isStrong ? 3 : isWeak ? 0 : Math.floor(Math.random() * 2);
    const l3Solved = isStrong ? 2 : isWeak ? 0 : Math.floor(Math.random() * 1);
    
    record[t] = {
      id: t,
      name: t.toUpperCase().replace('-', ' '),
      patterns: [],
      level1: { total: 4, solved: l1Solved },
      level2: { total: 4, solved: l2Solved },
      level3: { total: 4, solved: l3Solved },
      fullyCompleted: l1Solved + l2Solved + l3Solved === 12,
      patternStats: {}
    };
  });
  return record;
};


const defaultSettings: PrivacySettings = {
  profileVisibility: 'public',
  activityVisibility: 'connections',
  comparePermissions: 'connections',
  battleInvites: 'connections',
  onlineStatus: 'visible'
};

export const useConnectionsStore = create<ConnectionsState>()(
  (set, get) => ({
    connections: [],
    pendingRequests: [],
    sentRequests: [],
    activities: [],
    privacySettings: defaultSettings,
    inviteUsername: '',

    updateActiveUserData: (updater) => {
      const activeUsername = get().inviteUsername;
      if (!activeUsername) return;

      set(state => {
        const updatedFields = updater({
          connections: state.connections,
          pendingRequests: state.pendingRequests,
          sentRequests: state.sentRequests,
          activities: state.activities
        });
        const newState = {
          ...state,
          ...updatedFields
        };

        // Write to user-specific localStorage key
        try {
          localStorage.setItem(
            `patternlab_connections_${activeUsername}`,
            JSON.stringify({
              connections: newState.connections,
              pendingRequests: newState.pendingRequests,
              sentRequests: newState.sentRequests,
              activities: newState.activities,
              privacySettings: newState.privacySettings
            })
          );
        } catch {}

        return newState;
      });
    },

    initializeUsername: (emailOrName) => {
      const cleaned = emailOrName.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
      set({ inviteUsername: cleaned || `user_${Math.floor(1000 + Math.random() * 9000)}` });
      
      const activeUsername = cleaned;
      if (activeUsername) {
        // Seed settings if first time
        if (!localStorage.getItem(CONNECTIONS_MOCK_KEY)) {
          get().seedMockData();
        }

        let userData: {
          connections: Connection[];
          pendingRequests: ConnectionRequest[];
          sentRequests: string[];
          activities: ActivityItem[];
          privacySettings: PrivacySettings;
        } = {
          connections: [],
          pendingRequests: [],
          sentRequests: [],
          activities: [],
          privacySettings: defaultSettings
        };

        // Load from user-specific key
        try {
          const stored = localStorage.getItem(`patternlab_connections_${activeUsername}`);
          if (stored) {
            userData = JSON.parse(stored);
          }
        } catch {}

        // Purge stale mock users from loaded connection array
        const mockUsernames = ['tom_code', 'jerry_swe', 'alice_dp', 'bob_stack', 'techlead_official', 'byteslayer_99', 'coder_x_dsa'];
        userData.connections = (userData.connections || []).filter(c => !mockUsernames.includes(c.username));
        userData.pendingRequests = (userData.pendingRequests || []).filter(r => !mockUsernames.includes(r.username));
        userData.activities = (userData.activities || []).filter(a => !mockUsernames.includes(a.username));

        // Update the active user's public profile registry in localStorage for cross-tab invite card lookup
        try {
          const userStore = useUserStore.getState();
          const brainStore = useBrainStore.getState();
          const progressStore = useProgressStore.getState();
          const cbStore = useCodeBuddyStore.getState();
          const storedProfile = localStorage.getItem('patternlab_profile');
          const profileData = storedProfile ? JSON.parse(storedProfile) : {};

          const activeUser = userStore.user;
          const displayName = profileData.displayName || activeUser?.user_metadata?.full_name || activeUser?.email?.split('@')[0] || 'Developer';
          const avatarUrl = activeUser?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${activeUsername}`;

          const registry = JSON.parse(localStorage.getItem('patternlab_public_profiles') || '{}');
          const cbStats = cbStore.stats || { totalMatches: 0, wins: 0, losses: 0, winStreak: 0, averageSpeed: 180, points: 0 };
          const userStreak = progressStore.currentStreak || cbStats.winStreak || 6;

          registry[activeUsername] = {
            username: activeUsername,
            displayName,
            avatarUrl,
            points: progressStore.points || 0,
            rank: brainStore.rating?.tier ? `${brainStore.rating.tier} (Rating ${brainStore.rating.overall})` : 'Learner',
            strongestTopic: progressStore.topics ? Object.keys(progressStore.topics)[0] || 'Arrays' : 'Arrays',
            weakestTopic: 'Strings',
            bio: profileData.bio || 'DSA enthusiast!',
            location: profileData.location || 'Remote',
            github: profileData.github || '',
            twitter: profileData.twitter || '',
            brainRating: brainStore.rating || { overall: 600, tier: 'Solver', percentileRank: 50, codeQuality: 70, optimization: 65, debugging: 75, consistency: 65 },
            stats: {
              totalMatches: cbStats.totalMatches || 0,
              wins: cbStats.wins || 0,
              losses: cbStats.losses || 0,
              winStreak: userStreak,
              averageSpeed: cbStats.averageSpeed || 180,
              optimizationRating: 75,
              points: progressStore.points || 0
            }
          };
          localStorage.setItem('patternlab_public_profiles', JSON.stringify(registry));
        } catch {}

        set({
          connections: userData.connections || [],
          pendingRequests: userData.pendingRequests || [],
          sentRequests: userData.sentRequests || [],
          activities: userData.activities || [],
          privacySettings: userData.privacySettings || defaultSettings
        });
      }
    },

    sendRequest: async (username) => {
      if (!username || username.trim() === '') return false;
      const cleanUsername = username.toLowerCase().trim();
      const { sentRequests, connections, inviteUsername } = get();

      // Check if already connected or already sent
      if (connections.some(c => c.username === cleanUsername)) return false;
      if (sentRequests.includes(cleanUsername)) return false;

      // Gather real profile details from stores
      const userStore = useUserStore.getState();
      const brainStore = useBrainStore.getState();
      const progressStore = useProgressStore.getState();
      const storedProfile = localStorage.getItem('patternlab_profile');
      const profileData = storedProfile ? JSON.parse(storedProfile) : {};

      const activeUser = userStore.user;
      const displayName = profileData.displayName || activeUser?.user_metadata?.full_name || activeUser?.email?.split('@')[0] || 'Developer';
      const avatarUrl = activeUser?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${inviteUsername}`;

      const cbStore = useCodeBuddyStore.getState();
      const cbStats = cbStore.stats || { totalMatches: 0, wins: 0, losses: 0, winStreak: 0, averageSpeed: 180, points: 0 };
      const userStreak = progressStore.currentStreak || cbStats.winStreak || 6;

      const payload = {
        sender: inviteUsername,
        displayName,
        avatarUrl,
        points: progressStore.points || 0,
        rank: brainStore.rating?.tier ? `${brainStore.rating.tier} (Rating ${brainStore.rating.overall})` : 'Learner',
        strongestTopic: progressStore.topics ? Object.keys(progressStore.topics)[0] || 'Arrays' : 'Arrays',
        weakestTopic: 'Strings',
        bio: profileData.bio || 'DSA enthusiast!',
        location: profileData.location || 'Remote',
        github: profileData.github || '',
        twitter: profileData.twitter || '',
        brainRating: brainStore.rating || { overall: 600, tier: 'Solver', percentileRank: 50, codeQuality: 70, optimization: 65, debugging: 75, consistency: 65 },
        solvedProblems: progressStore.solvedProblems || [],
        stats: {
          totalMatches: cbStats.totalMatches || 0,
          wins: cbStats.wins || 0,
          losses: cbStats.losses || 0,
          winStreak: userStreak,
          averageSpeed: cbStats.averageSpeed || 180,
          optimizationRating: 75,
          points: progressStore.points || 0
        }
      };

      // Supabase Broadcast Request
      try {
        const channel = supabase.channel(`patternlab_conn_${cleanUsername}`);
        await channel.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.send({
              type: 'broadcast',
              event: 'connection_request',
              payload
            });
            channel.unsubscribe();
          }
        });
      } catch {}

      // Local HTML5 BroadcastChannel (cross-tab same browser)
      try {
        const localChannel = new BroadcastChannel('patternlab_connections');
        localChannel.postMessage({
          type: 'connection_request',
          targetUsername: cleanUsername,
          payload
        });
      } catch {}

      get().updateActiveUserData(state => ({
        sentRequests: [...state.sentRequests, cleanUsername]
      }));
      return true;
    },

    acceptRequest: (requestId) => {
      const { pendingRequests, inviteUsername } = get();
      const request = pendingRequests.find(r => r.id === requestId);
      if (!request) return;

      // Gather real profile details of the person accepting (ourselves)
      const userStore = useUserStore.getState();
      const brainStore = useBrainStore.getState();
      const progressStore = useProgressStore.getState();
      const storedProfile = localStorage.getItem('patternlab_profile');
      const profileData = storedProfile ? JSON.parse(storedProfile) : {};

      const activeUser = userStore.user;
      const displayName = profileData.displayName || activeUser?.user_metadata?.full_name || activeUser?.email?.split('@')[0] || 'Developer';
      const avatarUrl = activeUser?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${inviteUsername}`;

      const cbStore = useCodeBuddyStore.getState();
      const cbStats = cbStore.stats || { totalMatches: 0, wins: 0, losses: 0, winStreak: 0, averageSpeed: 180, points: 0 };
      const userStreak = progressStore.currentStreak || cbStats.winStreak || 6;

      const payload = {
        sender: inviteUsername,
        displayName,
        avatarUrl,
        points: progressStore.points || 0,
        rank: brainStore.rating?.tier ? `${brainStore.rating.tier} (Rating ${brainStore.rating.overall})` : 'Learner',
        strongestTopic: progressStore.topics ? Object.keys(progressStore.topics)[0] || 'Arrays' : 'Arrays',
        weakestTopic: 'Strings',
        bio: profileData.bio || 'DSA enthusiast!',
        location: profileData.location || 'Remote',
        github: profileData.github || '',
        twitter: profileData.twitter || '',
        brainRating: brainStore.rating || { overall: 600, tier: 'Solver', percentileRank: 50, codeQuality: 70, optimization: 65, debugging: 75, consistency: 65 },
        solvedProblems: progressStore.solvedProblems || [],
        stats: {
          totalMatches: cbStats.totalMatches || 0,
          wins: cbStats.wins || 0,
          losses: cbStats.losses || 0,
          winStreak: userStreak,
          averageSpeed: cbStats.averageSpeed || 180,
          optimizationRating: 75,
          points: progressStore.points || 0
        }
      };

      // Create connection object
      const newConnection: Connection = {
        id: `conn-${Date.now()}`,
        username: request.username,
        displayName: request.displayName,
        avatarUrl: request.avatarUrl,
        points: request.points,
        rank: request.rank,
        strongestTopic: request.strongestTopic || 'Arrays',
        weakestTopic: request.weakestTopic || 'Strings',
        online: true,
        bio: request.bio || `Solving algorithms passionately. Leveling up on PatternLab!`,
        location: request.location || 'Remote',
        github: request.github || '',
        twitter: request.twitter || '',
        brainRating: request.brainRating || { overall: Math.round(request.points * 0.8), tier: 'Skilled', percentileRank: 70, codeQuality: 80, optimization: 78, debugging: 75, consistency: 80 },
        solvedProblems: request.solvedProblems || ['two-sum'],
        stats: request.stats || { totalMatches: 0, wins: 0, losses: 0, winStreak: 6, strongestTopic: request.strongestTopic || 'Arrays', weakestTopic: request.weakestTopic || 'Strings', averageSpeed: 180, optimizationRating: 75, points: request.points },
        progress: generateMockProgress(request.strongestTopic || 'Arrays', request.weakestTopic || 'Strings')
      };

      // Add activity
      const newActivity: ActivityItem = {
        id: `act-${Date.now()}`,
        username: request.username,
        displayName: request.displayName,
        avatarUrl: request.avatarUrl,
        text: `${request.displayName} joined your coding network! 🤝`,
        timestamp: 'Just now'
      };

      // Supabase broadcast acceptance
      try {
        const channel = supabase.channel(`patternlab_conn_${request.username}`);
        channel.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.send({
              type: 'broadcast',
              event: 'request_accepted',
              payload
            });
            channel.unsubscribe();
          }
        });
      } catch {}

      // Local broadcast acceptance
      try {
        const localChannel = new BroadcastChannel('patternlab_connections');
        localChannel.postMessage({
          type: 'request_accepted',
          targetUsername: request.username,
          payload
        });
      } catch {}

      // Update active user state
      get().updateActiveUserData(state => ({
        connections: [newConnection, ...state.connections],
        pendingRequests: state.pendingRequests.filter(r => r.id !== requestId),
        activities: [newActivity, ...state.activities]
      }));
    },

    rejectRequest: (requestId) => {
      get().updateActiveUserData(state => ({
        pendingRequests: state.pendingRequests.filter(r => r.id !== requestId)
      }));
    },

    removeConnection: (connectionId) => {
      get().updateActiveUserData(state => ({
        connections: state.connections.filter(c => c.id !== connectionId)
      }));
    },

    updatePrivacySettings: (settings) => {
      const activeUsername = get().inviteUsername;
      set(state => {
        const newSettings = { ...state.privacySettings, ...settings };
        if (activeUsername) {
          try {
            const stored = localStorage.getItem(`patternlab_connections_${activeUsername}`);
            const data = stored ? JSON.parse(stored) : {
              connections: state.connections,
              pendingRequests: state.pendingRequests,
              sentRequests: state.sentRequests,
              activities: state.activities
            };
            data.privacySettings = newSettings;
            localStorage.setItem(`patternlab_connections_${activeUsername}`, JSON.stringify(data));
          } catch {}
        }
        return { privacySettings: newSettings };
      });
    },

    addActivity: (text) => {
      const myName = localStorage.getItem('patternlab_profile') 
        ? JSON.parse(localStorage.getItem('patternlab_profile')!).displayName 
        : 'You';

      const newActivity: ActivityItem = {
        id: `act-${Date.now()}`,
        username: get().inviteUsername,
        displayName: myName,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${get().inviteUsername}`,
        text,
        timestamp: 'Just now'
      };

      get().updateActiveUserData(state => ({
        activities: [newActivity, ...state.activities]
      }));
    },

    seedMockData: () => {
      const activeUsername = get().inviteUsername;
      set({
        connections: [],
        pendingRequests: [],
        sentRequests: [],
        activities: [],
        privacySettings: defaultSettings
      });
      if (activeUsername) {
        try {
          localStorage.setItem(
            `patternlab_connections_${activeUsername}`,
            JSON.stringify({
              connections: [],
              pendingRequests: [],
              sentRequests: [],
              activities: [],
              privacySettings: defaultSettings
            })
          );
        } catch {}
      }
      localStorage.setItem(CONNECTIONS_MOCK_KEY, 'true');
    },

    subscribeToSync: () => {
      const username = get().inviteUsername;
      if (!username) return () => {};

      const handleIncomingRequest = (payload: any) => {
        const { sender, displayName, avatarUrl, points, rank, strongestTopic, weakestTopic, bio, location, github, twitter, brainRating, solvedProblems, stats } = payload;
        
        const { connections, pendingRequests } = get();
        if (pendingRequests.some(p => p.username === sender) || connections.some(c => c.username === sender)) {
          return;
        }

        const newRequest: ConnectionRequest = {
          id: `req-${Date.now()}`,
          username: sender,
          displayName,
          avatarUrl,
          points,
          rank,
          strongestTopic: strongestTopic || 'Arrays',
          weakestTopic: weakestTopic || 'Strings',
          timestamp: 'Just now',
          bio,
          location,
          github,
          twitter,
          brainRating,
          solvedProblems,
          stats
        };

        get().updateActiveUserData(state => ({
          pendingRequests: [newRequest, ...state.pendingRequests]
        }));
      };

      const handleIncomingAcceptance = (payload: any) => {
        const { sender, displayName, avatarUrl, points, rank, strongestTopic, weakestTopic, bio, location, github, twitter, brainRating, solvedProblems, stats } = payload;
        const { sentRequests, connections } = get();
        
        if (connections.some(c => c.username === sender)) return;

        if (sentRequests.includes(sender)) {
          const newConnection: Connection = {
            id: `conn-${Date.now()}`,
            username: sender,
            displayName,
            avatarUrl,
            points,
            rank,
            strongestTopic: strongestTopic || 'Arrays',
            weakestTopic: weakestTopic || 'Strings',
            online: true,
            bio: bio || 'DSA enthusiast!',
            location: location || 'Remote',
            github: github || '',
            twitter: twitter || '',
            brainRating: brainRating || { overall: Math.round(points * 0.8), tier: 'Skilled', percentileRank: 70, codeQuality: 80, optimization: 78, debugging: 75, consistency: 80 },
            solvedProblems: solvedProblems || [],
            stats: stats || { totalMatches: 0, wins: 0, losses: 0, winStreak: 6, strongestTopic: strongestTopic || 'Arrays', weakestTopic: weakestTopic || 'Strings', averageSpeed: 180, optimizationRating: 75, points },
            progress: generateMockProgress(strongestTopic || 'Arrays', weakestTopic || 'Strings')
          };

          const newActivity: ActivityItem = {
            id: `act-${Date.now()}`,
            username: sender,
            displayName,
            avatarUrl,
            text: `${displayName} accepted your connection request! 🤝`,
            timestamp: 'Just now'
          };

          get().updateActiveUserData(state => ({
            connections: [newConnection, ...state.connections],
            sentRequests: state.sentRequests.filter(u => u !== sender),
            activities: [newActivity, ...state.activities]
          }));
        }
      };

      // 1. Supabase Channel Sync
      const channel = supabase.channel(`patternlab_conn_${username}`, {
        config: { broadcast: { self: false } }
      });

      channel
        .on('broadcast', { event: 'connection_request' }, ({ payload }) => {
          handleIncomingRequest(payload);
        })
        .on('broadcast', { event: 'request_accepted' }, ({ payload }) => {
          handleIncomingAcceptance(payload);
        });

      channel.subscribe();

      // 2. Local Broadcast Channel Listener (multi-tab same browser fallback)
      const localChannel = new BroadcastChannel('patternlab_connections');
      const handleLocalMessage = (event: MessageEvent) => {
        const { type, targetUsername, payload } = event.data;
        if (targetUsername === username) {
          if (type === 'connection_request') {
            handleIncomingRequest(payload);
          } else if (type === 'request_accepted') {
            handleIncomingAcceptance(payload);
          }
        }
      };

      localChannel.addEventListener('message', handleLocalMessage);

      return () => {
        channel.unsubscribe();
        localChannel.removeEventListener('message', handleLocalMessage);
        localChannel.close();
      };
    }
  })
);
