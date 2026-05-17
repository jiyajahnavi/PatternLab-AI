import React from 'react';
import { NavLink } from 'react-router-dom';
import { MessageSquare, BarChart2, User, Settings, Play, Bell, Map, Swords } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    { path: '/chat', icon: MessageSquare, label: 'Chat' },
    { path: '/roadmap', icon: Map, label: 'Roadmap' },
    { path: '/codebuddy', icon: Swords, label: 'CodeBuddy' },
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
                ? 'bg-background text-accent'
                : 'text-muted hover:text-primary hover:bg-background'
            }`
          }
        >
          <item.icon size={20} />

          {/* Tooltip */}
          <div className="absolute left-full ml-3 px-2 py-1 bg-background text-primary text-xs rounded border border-border opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity duration-150">
            {item.label}
          </div>
        </NavLink>
      ))}
    </div>
  );
};