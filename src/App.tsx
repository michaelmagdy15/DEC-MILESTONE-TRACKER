import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import { Layout } from './components/Layout';
// Placeholder imports (components will be created next)
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { Engineers } from './pages/Engineers';
import { Entries } from './pages/Entries';
import { Reports } from './pages/Reports';

function App() {
  return (
    <Router>
      <DataProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/engineers" element={<Engineers />} />
            <Route path="/entries" element={<Entries />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </DataProvider>
    </Router>
  );
}

export default App;
