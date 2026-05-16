import React from 'react';
import { NavLink } from 'react-router-dom';
import { MessageSquare, BarChart2, User, Settings, Play, Bell, Sparkles } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    { path: '/chat', icon: MessageSquare, label: 'Chat' },
    { path: '/brain', icon: Sparkles, label: 'Brain', accent: true },
    { path: '/visualizer', icon: Play, label: 'Visualizer' },
    { path: '/progress', icon: BarChart2, label: 'Progress' },
    { path: '/reminder', icon: Bell, label: 'Reminder' },
    { path: '/profile', icon: User, label: 'Profile' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="w-14 h-full bg-surface border-r border-border flex flex-col items-center py-4 gap-6 shrink-0">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `relative group p-2 rounded-lg transition-colors ${
              isActive
                ? (item.accent ? 'bg-violet-500/20 text-violet-400' : 'bg-background text-accent')
                : (item.accent ? 'text-violet-400/60 hover:text-violet-400 hover:bg-violet-500/10' : 'text-muted hover:text-primary hover:bg-background')
            }`
          }
        >
          <item.icon size={20} />
          {/* Pulse indicator for Brain */}
          {item.accent && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse" />
          )}
          {/* Tooltip */}
          <div className="absolute left-full ml-3 px-2 py-1 bg-background text-primary text-xs rounded border border-border opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity duration-150">
            {item.label}
          </div>
        </NavLink>
      ))}
    </div>
  );
};
