import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Topbar } from './components/shared/Topbar';
import { Sidebar } from './components/shared/Sidebar';
import { useConnectionsStore } from './store/useConnectionsStore';
import { useUserStore } from './store/useUserStore';

export const Layout: React.FC = () => {
  const { user } = useUserStore();
  const { inviteUsername, subscribeToSync, initializeUsername } = useConnectionsStore();

  // Sync connection state with current user credentials globally
  useEffect(() => {
    if (user) {
      const emailOrName = user.email || user.user_metadata?.full_name || '';
      initializeUsername(emailOrName);
    }
  }, [user, initializeUsername]);

  // Global sync listener for connection requests & acceptances
  useEffect(() => {
    if (user && inviteUsername) {
      const unsubscribe = subscribeToSync();
      return () => {
        unsubscribe();
      };
    }
  }, [user, inviteUsername, subscribeToSync]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
