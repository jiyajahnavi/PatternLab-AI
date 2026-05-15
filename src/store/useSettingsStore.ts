import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ModelType = 'gemini-flash-latest' | 'gemini-pro-latest' | 'gpt-4o' | 'claude-3.5-sonnet' | 'custom';

export type MentorMode = 'learn' | 'interview' | 'debug' | 'optimization' | 'revision';

interface SettingsState {
  preferredLanguage: string;
  model: ModelType;
  theme: 'dark' | 'light' | 'system';
  mentorMode: MentorMode;
  apiKeys: {
    gemini: string;
    openai: string;
    anthropic: string;
    customUrl: string;
    customKey: string;
  };
  setPreferredLanguage: (lang: string) => void;
  setModel: (model: ModelType) => void;
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
  setMentorMode: (mode: MentorMode) => void;
  setApiKey: (provider: keyof SettingsState['apiKeys'], key: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      preferredLanguage: 'python',
      model: 'gemini-flash-latest',
      theme: 'dark',
      mentorMode: 'learn',
      apiKeys: {
        gemini: '',
        openai: '',
        anthropic: '',
        customUrl: '',
        customKey: '',
      },
      setPreferredLanguage: (lang) => set({ preferredLanguage: lang }),
      setModel: (model) => set({ model }),
      setTheme: (theme) => set({ theme }),
      setMentorMode: (mode) => set({ mentorMode: mode }),
      setApiKey: (provider, key) => 
        set((state) => ({ apiKeys: { ...state.apiKeys, [provider]: key } })),
    }),
    {
      name: 'patternlab-settings',
    }
  )
);
