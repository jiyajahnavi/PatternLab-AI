import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addDays, isBefore, startOfDay, parseISO } from 'date-fns';

export interface RevisionHistory {
  date: string;
  status: 'completed' | 'skipped';
}

export interface ReminderItem {
  problemId: string;
  title: string;
  topic: string;
  dateSolved: string;
  nextRevisionDate: string | null;
  revisionCount: number;
  history: RevisionHistory[];
  completed: boolean;
}
interface ReminderState {
  intervals: number[];
  reminders: Record<string, ReminderItem>;
  weekendMode: boolean;
  
  scheduleReminder: (problemId: string, title: string, topic: string) => void;
  completeRevision: (problemId: string) => void;
  skipRevision: (problemId: string) => void;
  updateIntervals: (intervals: number[]) => void;
  toggleWeekendMode: () => void;
  getTodayTasks: () => ReminderItem[];
}

const getNextDate = (days: number, weekendMode: boolean) => {
  let date = addDays(new Date(), days);
  if (weekendMode) {
    const day = date.getDay(); // 0: Sun, 1: Mon, ..., 6: Sat
    if (day >= 1 && day <= 5) { // It's a weekday
      date = addDays(date, 6 - day); // Move to coming Saturday
    }
  }
  return date;
};

export const useReminderStore = create<ReminderState>()(
  persist(
    (set, get) => ({
      intervals: [3, 7, 30], // Default: 3 days, 1 week, 1 month
      reminders: {},
      weekendMode: false,

      scheduleReminder: (problemId, title, topic) => {
        set((state) => {
          if (state.reminders[problemId]) {
            console.log(`[Reminder] Problem ${problemId} already scheduled.`);
            return state;
          }

          const now = new Date();
          const nextDays = state.intervals[0] || 3;
          const nextDate = getNextDate(nextDays, state.weekendMode);
          
          if (isNaN(nextDate.getTime())) {
            console.error('[Reminder] Invalid next date generated');
            return state;
          }

          console.log(`[Reminder] Scheduling ${title} for ${nextDate.toISOString()}`);

          return {
            reminders: {
              ...state.reminders,
              [problemId]: {
                problemId,
                title,
                topic,
                dateSolved: now.toISOString(),
                nextRevisionDate: nextDate.toISOString(),
                revisionCount: 0,
                history: [],
                completed: false,
              },
            },
          };
        });
      },

      completeRevision: (problemId) => {
        set((state) => {
          const item = state.reminders[problemId];
          if (!item) return state;

          const nextIndex = item.revisionCount + 1;
          const nextDays = state.intervals[nextIndex];
          const nextDate = nextDays ? getNextDate(nextDays, state.weekendMode) : null;

          return {
            reminders: {
              ...state.reminders,
              [problemId]: {
                ...item,
                revisionCount: nextIndex,
                nextRevisionDate: nextDate ? nextDate.toISOString() : null,
                completed: !nextDate,
                history: [
                  ...item.history,
                  { date: new Date().toISOString(), status: 'completed' },
                ],
              },
            },
          };
        });
      },

      skipRevision: (problemId) => {
        set((state) => {
          const item = state.reminders[problemId];
          if (!item) return state;

          return {
            reminders: {
              ...state.reminders,
              [problemId]: {
                ...item,
                nextRevisionDate: addDays(new Date(), 1).toISOString(), // Snooze to tomorrow
                history: [
                  ...item.history,
                  { date: new Date().toISOString(), status: 'skipped' },
                ],
              },
            },
          };
        });
      },

      updateIntervals: (intervals) => set({ intervals }),
      
      toggleWeekendMode: () => set((state) => ({ weekendMode: !state.weekendMode })),

      getTodayTasks: () => {
        const { reminders } = get();
        const today = startOfDay(new Date());
        return Object.values(reminders).filter((item) => {
          if (!item.nextRevisionDate || item.completed) return false;
          const revisionDate = startOfDay(parseISO(item.nextRevisionDate));
          return isBefore(revisionDate, addDays(today, 1));
        });
      },
    }),
    {
      name: 'patternlab_reminders',
    }
  )
);
