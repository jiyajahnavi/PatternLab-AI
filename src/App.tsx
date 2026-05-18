import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams, useLocation } from 'react-router-dom';
import { Layout } from './Layout';
import { LoginPage } from './pages/LoginPage';

import { ChatPage } from './pages/ChatPage';
import { ProblemPage } from './pages/ProblemPage';
import { CodeBuddyPage } from './pages/CodeBuddyPage';
import { VisualizerPage } from './pages/VisualizerPage';
import { ProgressPage } from './pages/ProgressPage';
import { RoadmapPage } from './pages/RoadmapPage';
import { ReminderPage } from './pages/ReminderPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { ConnectPage } from './pages/ConnectPage';

import { authService } from './services/auth.service';
import { useUserStore } from './store/useUserStore';

const LoginRoute = () => {
  const { user } = useUserStore();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/chat';

  return user ? <Navigate to={redirect} replace /> : <LoginPage />;
};

const ProtectedRoute = () => {
  const { user } = useUserStore();
  const location = useLocation();

  return user ? (
    <Layout />
  ) : (
    <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />
  );
};

function App() {
  const { user, setUser, clearUser } = useUserStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // On first load, check if the user is already logged in (e.g., after Google redirect)
    authService.getUser()
      .then((u) => setUser(u))
      .catch(() => clearUser())
      .finally(() => setLoading(false));

    // Subscribe to future auth state changes (login/logout)
    const { data: subscription } = authService.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        clearUser();
      }
    });

    return () => {
      subscription?.subscription?.unsubscribe();
    };
  }, [setUser, clearUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center animate-pulse">
            <span className="text-accent font-bold font-mono">P</span>
          </div>
          <div className="text-muted text-sm font-mono">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginRoute />} />

        {/* Protected routes */}
        <Route path="/" element={<ProtectedRoute />}>
          <Route index element={<Navigate to="/chat" replace />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="roadmap" element={<RoadmapPage />} />
          <Route path="codebuddy" element={<CodeBuddyPage />} />
          <Route path="problem/:id" element={<ProblemPage />} />
          <Route path="visualizer" element={<VisualizerPage />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="reminder" element={<ReminderPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="connect/:username" element={<ConnectPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to={user ? '/chat' : '/login'} replace />} />
      </Routes>
    </Router>
  );
}

export default App;