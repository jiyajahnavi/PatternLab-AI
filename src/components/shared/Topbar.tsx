import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useUserStore } from '../../store/useUserStore';
import { authService } from '../../services/auth.service';
import { LogOut } from 'lucide-react';

export const Topbar: React.FC = () => {
  const location = useLocation();
  const { model, setModel } = useSettingsStore();
  const { user, clearUser } = useUserStore();
  const [showMenu, setShowMenu] = useState(false);

  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path === '/') return 'Home';
    if (path.startsWith('/chat')) return 'Chat';
    if (path.startsWith('/problem')) return 'IDE';
    if (path.startsWith('/progress')) return 'Progress';
    if (path.startsWith('/profile')) return 'Profile';
    if (path.startsWith('/settings')) return 'Settings';
    if (path.startsWith('/visualizer')) return 'Visualizer';
    return 'PatternLab';
  };

  const handleSignOut = async () => {
    setShowMenu(false);
    await authService.signOut();
    clearUser();
  };

  const avatarChar = user?.user_metadata?.full_name?.charAt(0)?.toUpperCase()
    || user?.email?.charAt(0)?.toUpperCase()
    || 'U';
  const avatarUrl = user?.user_metadata?.avatar_url;
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  return (
    <div className="h-10 bg-surface border-b border-border flex items-center justify-between px-4 text-sm text-primary">
      <div className="flex items-center gap-4">
        <div className="font-mono text-accent font-bold tracking-wider">PatternLab</div>
        <div className="text-muted hidden md:block">/</div>
        <div className="text-muted hidden md:block">{getBreadcrumb()}</div>
      </div>
      
      <div className="flex items-center gap-4">
        <select 
          value={model} 
          onChange={(e) => setModel(e.target.value as any)}
          className="bg-background border border-border text-xs rounded px-2 py-1 outline-none focus:border-accent"
        >
          <option value="gemini-flash-latest">Gemini Flash</option>
          <option value="gemini-pro-latest">Gemini Pro</option>
          <option value="gpt-4o">GPT-4o</option>
          <option value="claude-3.5-sonnet">Claude 3.5 Sonnet</option>
          <option value="custom">Custom (Local)</option>
        </select>
        
        {/* User Avatar Menu */}
        <div className="relative">
          <button
            id="user-menu-btn"
            onClick={() => setShowMenu(v => !v)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-6 h-6 rounded-full object-cover border border-border" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-accent text-background flex items-center justify-center font-bold text-xs">
                {avatarChar}
              </div>
            )}
            <span className="text-xs text-muted hidden sm:block truncate max-w-[100px]">{displayName}</span>
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-8 z-20 bg-surface border border-border rounded-lg shadow-xl shadow-black/30 min-w-[160px] py-1 overflow-hidden">
                <div className="px-3 py-2 border-b border-border/50">
                  <div className="text-xs font-semibold text-primary truncate">{displayName}</div>
                  <div className="text-[10px] text-muted truncate">{user?.email}</div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted hover:text-red-400 hover:bg-red-500/5 transition-colors"
                >
                  <LogOut size={12} />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
