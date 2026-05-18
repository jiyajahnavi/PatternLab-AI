import { create } from 'zustand';

interface UserState {
  user: any | null;
  profile: any | null;
  setUser: (user: any) => void;
  setProfile: (profile: any) => void;
  clearUser: () => void;
}

const getMergedUser = (user: any) => {
  if (!user) return null;
  try {
    const stored = localStorage.getItem('patternlab_profile');
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...user,
        user_metadata: {
          ...user.user_metadata,
          avatar_url: parsed.avatarUrl || user.user_metadata?.avatar_url,
          full_name: parsed.displayName || user.user_metadata?.full_name,
        }
      };
    }
  } catch (e) {
    console.error("Error merging custom user profile:", e);
  }
  return user;
};

export const useUserStore = create<UserState>((set) => ({
  user: null,
  profile: null,
  setUser: (user) => set({ user: getMergedUser(user) }),
  setProfile: (profile) => set({ profile }),
  clearUser: () => set({ user: null, profile: null }),
}));
