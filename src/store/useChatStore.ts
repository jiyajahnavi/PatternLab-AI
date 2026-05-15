import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatSession {
  id: string;
  title: string;
  updatedAt: string;
  messages: ChatMessage[];
}

interface ChatState {
  sessions: ChatSession[];
  activeSessionId: string | null;
  
  createSession: (initialMessage: string) => string;
  addMessage: (sessionId: string, message: ChatMessage) => void;
  updateLastMessage: (sessionId: string, newContent: string) => void;
  setActiveSession: (id: string | null) => void;
  deleteSession: (id: string) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      sessions: [],
      activeSessionId: null,

      createSession: (initialMessage) => {
        const id = crypto.randomUUID();
        // Generate a simple title from the first few words of the initial message
        const words = initialMessage.split(' ').slice(0, 5).join(' ');
        const title = words.length < initialMessage.length ? `${words}...` : words;

        const newSession: ChatSession = {
          id,
          title: title || 'New Conversation',
          updatedAt: new Date().toISOString(),
          messages: [] // Initial message will be added via addMessage
        };

        set((state) => ({
          sessions: [newSession, ...state.sessions],
          activeSessionId: id
        }));

        return id;
      },

      addMessage: (sessionId, message) => {
        set((state) => ({
          sessions: state.sessions.map((session) => {
            if (session.id === sessionId) {
              return {
                ...session,
                updatedAt: new Date().toISOString(),
                messages: [...session.messages, message]
              };
            }
            return session;
          })
        }));
      },

      updateLastMessage: (sessionId, newContent) => {
        set((state) => ({
          sessions: state.sessions.map((session) => {
            if (session.id === sessionId && session.messages.length > 0) {
              const messages = [...session.messages];
              messages[messages.length - 1] = {
                ...messages[messages.length - 1],
                content: newContent
              };
              return { ...session, messages, updatedAt: new Date().toISOString() };
            }
            return session;
          })
        }));
      },

      setActiveSession: (id) => set({ activeSessionId: id }),

      deleteSession: (id) => set((state) => ({
        sessions: state.sessions.filter((s) => s.id !== id),
        activeSessionId: state.activeSessionId === id ? null : state.activeSessionId
      }))
    }),
    {
      name: 'chat-storage',
    }
  )
);
