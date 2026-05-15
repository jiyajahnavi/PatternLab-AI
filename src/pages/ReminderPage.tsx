import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Settings2, 
  Plus, 
  Trash2, 
  ChevronRight, 
  Bell,
  History,
  Trophy,
  BarChart3,
  Play
} from 'lucide-react';
import { useReminderStore } from '../store/useReminderStore';
import type { ReminderItem } from '../store/useReminderStore';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, addDays } from 'date-fns';

export const ReminderPage: React.FC = () => {
  const { 
    intervals, 
    reminders, 
    updateIntervals, 
    completeRevision, 
    getTodayTasks,
    weekendMode,
    toggleWeekendMode
  } = useReminderStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'history' | 'settings'>('today');
  const [newInterval, setNewInterval] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const todayTasks = getTodayTasks();
  const allReminders = Object.values(reminders);
  
  const upcomingTasks = allReminders
    .filter(r => !r.completed && !todayTasks.some(t => t.problemId === r.problemId))
    .sort((a, b) => (a.nextRevisionDate || '').localeCompare(b.nextRevisionDate || ''));

  const historyTasks = allReminders
    .filter(r => r.history.length > 0)
    .sort((a, b) => {
      const lastA = a.history[a.history.length - 1]?.date || '';
      const lastB = b.history[b.history.length - 1]?.date || '';
      return lastB.localeCompare(lastA);
    });

  useEffect(() => {
    if ("Notification" in window) {
      setNotificationsEnabled(Notification.permission === "granted");
    }
  }, []);

  const requestNotifications = async () => {
    const permission = await Notification.requestPermission();
    setNotificationsEnabled(permission === "granted");
  };

  const handleStartRevision = (item: ReminderItem) => {
    // In a real app, we'd fetch the problem data. For now, we'll try to find it in curriculum or use mock.
    navigate(`/problem/${item.problemId}`);
  };

  const handleAddInterval = () => {
    const days = parseInt(newInterval);
    if (!isNaN(days) && days > 0) {
      updateIntervals([...intervals, days].sort((a, b) => a - b));
      setNewInterval('');
    }
  };

  const removeInterval = (index: number) => {
    const newInts = [...intervals];
    newInts.splice(index, 1);
    updateIntervals(newInts);
  };

  const completionRate = allReminders.length > 0 
    ? (allReminders.reduce((acc, r) => acc + r.history.filter(h => h.status === 'completed').length, 0) / 
       allReminders.reduce((acc, r) => acc + r.history.length + (r.completed ? 0 : 1), 0) * 100).toFixed(0)
    : 0;

  return (
    <div className="h-full overflow-y-auto bg-background text-primary p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Revision Center
            </h1>
            <p className="text-muted text-sm mt-1">Spaced repetition for long-term mastery.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-surface border border-border px-4 py-2 rounded-xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                <BarChart3 size={18} />
              </div>
              <div>
                <div className="text-lg font-bold font-mono">{completionRate}%</div>
                <div className="text-[10px] text-muted uppercase font-bold tracking-wider">Consistency</div>
              </div>
            </div>
            <button 
              onClick={requestNotifications}
              className={`p-2.5 rounded-xl border transition-all ${
                notificationsEnabled 
                  ? 'bg-green-500/10 border-green-500/20 text-green-500' 
                  : 'bg-surface border-border text-muted hover:text-primary'
              }`}
              title={notificationsEnabled ? 'Notifications Active' : 'Enable Notifications'}
            >
              <Bell size={20} className={notificationsEnabled ? 'fill-green-500/20' : ''} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 bg-surface/50 p-1 rounded-xl border border-border w-fit">
          {[
            { id: 'today', label: 'Due Today', icon: Clock, count: todayTasks.length },
            { id: 'upcoming', label: 'Upcoming', icon: Calendar, count: upcomingTasks.length },
            { id: 'history', label: 'History', icon: History },
            { id: 'settings', label: 'Settings', icon: Settings2 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id 
                  ? 'bg-accent text-background shadow-lg shadow-accent/20' 
                  : 'text-muted hover:text-primary hover:bg-surface'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === tab.id ? 'bg-background/20 text-background' : 'bg-accent/10 text-accent'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="min-h-[400px]">
          {activeTab === 'today' && (
            <div className="space-y-4">
              {todayTasks.length === 0 ? (
                <div className="bg-surface/30 border border-dashed border-border rounded-2xl p-12 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-accent/5 flex items-center justify-center text-accent/20 mb-4">
                    <CheckCircle2 size={40} />
                  </div>
                  <h3 className="text-lg font-bold text-primary">All caught up!</h3>
                  <p className="text-muted max-w-xs mt-2 text-sm">You have no questions scheduled for revision today. Keep solving new problems to build your list.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {todayTasks.map((task) => (
                    <div key={task.problemId} className="group bg-surface border border-border rounded-2xl p-5 hover:border-accent/50 transition-all shadow-sm hover:shadow-xl hover:shadow-accent/5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-accent/10 transition-colors" />
                      
                      <div className="flex flex-col gap-4 relative z-10">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-bold text-accent uppercase tracking-widest bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20 mb-2 inline-block">
                              {task.topic}
                            </span>
                            <h3 className="font-bold text-lg group-hover:text-accent transition-colors">{task.title}</h3>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] text-muted uppercase font-bold">Solved On</div>
                            <div className="text-sm font-mono">{format(parseISO(task.dateSolved), 'MMM dd')}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 py-3 border-y border-border/50">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                              <History size={16} />
                            </div>
                            <div>
                              <div className="text-sm font-bold">{task.revisionCount}</div>
                              <div className="text-[9px] text-muted uppercase font-bold">Revised</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                              <Trophy size={16} />
                            </div>
                            <div>
                              <div className="text-sm font-bold">{intervals[task.revisionCount] || '-'}d</div>
                              <div className="text-[9px] text-muted uppercase font-bold">Next Interval</div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleStartRevision(task)}
                            className="flex-1 bg-accent text-background py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                          >
                            <Play size={16} fill="currentColor" /> Start Revision
                          </button>
                          <button 
                            onClick={() => completeRevision(task.problemId)}
                            className="p-2.5 rounded-xl border border-border bg-surface hover:border-green-500/50 hover:text-green-500 transition-all"
                            title="Mark as Revised"
                          >
                            <CheckCircle2 size={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'upcoming' && (
            <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-background/50 border-b border-border">
                    <th className="px-6 py-4 text-[10px] font-bold text-muted uppercase tracking-widest">Problem</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-muted uppercase tracking-widest">Topic</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-muted uppercase tracking-widest text-right">Revision Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {upcomingTasks.map((task) => {
                    const nextDate = parseISO(task.nextRevisionDate!);
                    const daysLeft = Math.ceil((nextDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    
                    // Generate full future schedule
                    const futureSchedule = [];
                    let currentDate = nextDate;
                    for (let i = task.revisionCount; i < intervals.length; i++) {
                      futureSchedule.push({
                        date: currentDate,
                        label: `Rev ${i + 1}`,
                        interval: intervals[i]
                      });
                      if (intervals[i + 1]) {
                        currentDate = addDays(currentDate, intervals[i + 1] - intervals[i]);
                      }
                    }

                    return (
                      <tr key={task.problemId} className="hover:bg-accent/5 transition-colors group">
                        <td className="px-6 py-4 align-top">
                          <div className="font-bold group-hover:text-accent transition-colors">{task.title}</div>
                          <div className="text-[10px] text-muted flex items-center gap-1 mt-1 font-mono uppercase tracking-wider">
                            <Clock size={10} /> Next: {format(nextDate, 'MMM dd')}
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <span className="px-2 py-1 bg-surface border border-border rounded text-[10px] font-bold uppercase tracking-wider">
                            {task.topic}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-1">
                              {futureSchedule.map((step, idx) => (
                                <div 
                                  key={idx}
                                  className={`flex flex-col items-center group/step`}
                                  title={`${step.label}: ${format(step.date, 'MMM dd, yyyy')}`}
                                >
                                  <div className={`w-2 h-2 rounded-full border-2 ${
                                    idx === 0 ? 'bg-accent border-accent' : 'bg-transparent border-muted/30'
                                  }`} />
                                  {idx < futureSchedule.length - 1 && (
                                    <div className="w-8 h-px bg-border my-1" />
                                  )}
                                  <div className="text-[8px] font-bold text-muted opacity-0 group-hover/step:opacity-100 transition-opacity whitespace-nowrap">
                                    {format(step.date, 'MM/dd')}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="text-xs font-bold text-primary">
                              {daysLeft <= 0 ? 'Due Today' : `${daysLeft} days until next`}
                            </div>
                            <div className="flex flex-wrap justify-end gap-1 max-w-[200px]">
                              {futureSchedule.map((step, idx) => (
                                <div key={idx} className="text-[9px] bg-background/50 border border-border px-1.5 py-0.5 rounded text-muted whitespace-nowrap">
                                  {step.label}: <span className="text-primary font-bold">{format(step.date, 'MMM dd')}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {upcomingTasks.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-muted text-sm italic">
                        No upcoming revisions scheduled.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              {historyTasks.map((task) => (
                <div key={task.problemId} className="bg-surface border border-border rounded-2xl p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold">{task.title}</h4>
                      <div className="text-xs text-muted flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-1"><History size={10} /> {task.revisionCount} revisions</span>
                        <span>•</span>
                        <span>Last revised {format(parseISO(task.history[task.history.length-1].date), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => navigate(`/problem/${task.problemId}`)}
                    className="p-2 rounded-lg hover:bg-background transition-colors"
                  >
                    <ChevronRight size={20} className="text-muted" />
                  </button>
                </div>
              ))}
              {historyTasks.length === 0 && (
                <div className="text-center py-12 text-muted italic text-sm">
                  No revision history yet.
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-surface border border-border rounded-2xl p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Clock size={20} className="text-accent" /> Spaced Repetition Intervals
                  </h3>
                  <p className="text-muted text-sm mt-1">Define how many days to wait between each revision.</p>
                </div>

                <div className="space-y-3">
                  {intervals.map((days, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-background/50 rounded-xl border border-border group">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-[10px] font-bold text-accent">
                          {index + 1}
                        </div>
                        <span className="text-sm font-medium">Revision after <span className="font-bold text-primary">{days}</span> days</span>
                      </div>
                      <button 
                        onClick={() => removeInterval(index)}
                        className="text-muted hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input 
                    type="number" 
                    placeholder="Enter days..."
                    value={newInterval}
                    onChange={(e) => setNewInterval(e.target.value)}
                    className="flex-1 bg-background border border-border rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-accent outline-none"
                  />
                  <button 
                    onClick={handleAddInterval}
                    className="bg-accent text-background px-4 py-2 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity flex items-center gap-2"
                  >
                    <Plus size={16} /> Add
                  </button>
                </div>
              </div>

              <div className="bg-surface border border-border rounded-2xl p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Bell size={20} className="text-accent" /> Notifications
                  </h3>
                  <p className="text-muted text-sm mt-1">Get reminded when you have questions to revise.</p>
                </div>

                <div className="flex items-center justify-between p-4 bg-background/50 rounded-xl border border-border">
                  <div>
                    <div className="text-sm font-bold">Browser Notifications</div>
                    <div className="text-xs text-muted">Daily reminders at 9:00 AM</div>
                  </div>
                  <div 
                    onClick={requestNotifications}
                    className={`w-12 h-6 rounded-full relative transition-all cursor-pointer ${
                      notificationsEnabled ? 'bg-accent' : 'bg-muted/30'
                    }`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                      notificationsEnabled ? 'left-7' : 'left-1'
                    }`} />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-background/50 rounded-xl border border-border">
                  <div>
                    <div className="text-sm font-bold">Weekend Revision Mode</div>
                    <div className="text-xs text-muted">Batch all weekday revisions for the weekend</div>
                  </div>
                  <div 
                    onClick={toggleWeekendMode}
                    className={`w-12 h-6 rounded-full relative transition-all cursor-pointer ${
                      weekendMode ? 'bg-accent' : 'bg-muted/30'
                    }`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                      weekendMode ? 'left-7' : 'left-1'
                    }`} />
                  </div>
                </div>

                <div className="p-4 bg-accent/5 border border-accent/20 rounded-xl flex gap-3">
                  <AlertCircle size={18} className="text-accent shrink-0 mt-0.5" />
                  <p className="text-xs text-muted leading-relaxed">
                    Research shows that revising a problem <span className="text-primary font-bold">3 days</span>, <span className="text-primary font-bold">1 week</span>, and <span className="text-primary font-bold">1 month</span> after the first solve increases retention by up to <span className="text-accent font-bold">80%</span>.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
