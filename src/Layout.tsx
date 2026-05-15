import React from 'react';
import { Outlet } from 'react-router-dom';
import { Topbar } from './components/shared/Topbar';
import { Sidebar } from './components/shared/Sidebar';

export const Layout: React.FC = () => {
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
