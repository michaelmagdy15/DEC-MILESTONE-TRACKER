// ... Removed useLocation since it threw a warning, returning back to previous imports

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
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

const ProtectedRoute = ({ children, requireAdmin, requireEngineerOrAdmin }: { children: React.ReactNode, requireAdmin?: boolean, requireEngineerOrAdmin?: boolean }) => {
  const { user, role, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return <div className="min-h-screen flex items-center justify-center">Loading session...</div>;
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
                    <Route path="/engineers" element={<ProtectedRoute requireAdmin><Engineers /></ProtectedRoute>} />
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
