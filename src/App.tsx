// ... Removed useLocation since it threw a warning, returning back to previous imports

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { Engineers } from './pages/Engineers';
import { Entries } from './pages/Entries';
import { Reports } from './pages/Reports';
import { Attendance } from './pages/Attendance';
import { Login } from './pages/Login';

const ProtectedRoute = ({ children, requireAdmin }: { children: React.ReactNode, requireAdmin?: boolean }) => {
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

  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <DataProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/*" element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/entries" element={<Entries />} />
                    <Route path="/attendance" element={<Attendance />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/projects" element={<ProtectedRoute requireAdmin><Projects /></ProtectedRoute>} />
                    <Route path="/engineers" element={<ProtectedRoute requireAdmin><Engineers /></ProtectedRoute>} />
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
