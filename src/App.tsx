import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider, useData } from './context/DataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { ProjectDetails } from './pages/ProjectDetails';
import { Engineers } from './pages/Engineers';
import { Entries } from './pages/Entries';
import { Reports } from './pages/Reports';
import { Attendance } from './pages/Attendance';
import { Login } from './pages/Login';
import { ResetPassword } from './pages/ResetPassword';
import { ClientDashboard } from './pages/ClientDashboard';
import { Profile } from './pages/Profile';
import { Financials } from './pages/Financials';
import { Emails } from './pages/Emails';
import { Meetings } from './pages/Meetings';

/**
 * Lightweight component that captures the Zoho OAuth callback code,
 * stashes it in sessionStorage, and redirects to /emails.
 * This runs OUTSIDE ProtectedRoute so the code is never lost
 * even if auth hasn't loaded yet.
 */
const ZohoCallbackRedirect = () => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  if (code) {
    sessionStorage.setItem('zoho_pending_code', code);
  }
  return <Navigate to="/emails" replace />;
};

const ProtectedRoute = ({ children, requireAdmin, requireEngineerOrAdmin, skipDataWait }: { children: React.ReactNode, requireAdmin?: boolean, requireEngineerOrAdmin?: boolean, skipDataWait?: boolean }) => {
  const { user, role, isLoadingAuth } = useAuth();
  const { isLoading: isLoadingData } = useData();

  if (isLoadingAuth || (!skipDataWait && user && isLoadingData)) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">
            Synchronizing Session {isLoadingAuth ? '(Auth)' : '(Data)'}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  if (requireEngineerOrAdmin && role === 'client') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const HomeRoute = () => {
  const { role } = useAuth();
  if (role === 'client') return <ClientDashboard />;
  return <Dashboard />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <DataProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            {/* Zoho OAuth callback — must be OUTSIDE ProtectedRoute */}
            <Route path="/emails/callback" element={<ZohoCallbackRedirect />} />

            <Route path="/*" element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<HomeRoute />} />
                    <Route path="/entries" element={<ProtectedRoute requireEngineerOrAdmin><Entries /></ProtectedRoute>} />
                    <Route path="/attendance" element={<ProtectedRoute requireEngineerOrAdmin><Attendance /></ProtectedRoute>} />
                    <Route path="/reports" element={<ProtectedRoute requireAdmin><Reports /></ProtectedRoute>} />
                    <Route path="/projects" element={<ProtectedRoute requireEngineerOrAdmin><Projects /></ProtectedRoute>} />
                    <Route path="/projects/:id" element={<ProjectDetails />} />
                    <Route path="/meetings" element={<ProtectedRoute requireEngineerOrAdmin><Meetings /></ProtectedRoute>} />
                    <Route path="/engineers" element={<ProtectedRoute requireAdmin><Engineers /></ProtectedRoute>} />
                    <Route path="/emails/*" element={<ProtectedRoute requireEngineerOrAdmin skipDataWait><Emails /></ProtectedRoute>} />
                    <Route path="/financials" element={<ProtectedRoute requireAdmin><Financials /></ProtectedRoute>} />
                    <Route path="/profile" element={<Profile />} />
                    {/* Fallback for authenticated users */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </DataProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
