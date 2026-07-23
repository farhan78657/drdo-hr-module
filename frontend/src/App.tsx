import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardLayout from './pages/hr/DashboardLayout';
import DashboardHome from './pages/hr/DashboardHome';
import AddIntern from './pages/hr/AddIntern';
import UnassignedList from './pages/hr/UnassignedList';
import OngoingList from './pages/hr/OngoingList';
import ScientistsList from './pages/hr/ScientistsList';
import CompletedList from './pages/hr/CompletedList';
import CertificatesPage from './pages/hr/CertificatesPage';
import AttendancePage from './pages/hr/AttendancePage';
import MentorDashboardLayout from './pages/mentor/MentorDashboardLayout';
import MentorDashboardHome from './pages/mentor/MentorDashboardHome';
import MentorPassRequests from './pages/mentor/MentorPassRequests';

// A role-enforced protected route wrapper
const ProtectedRoute = ({ children, allowedRole }: { children: React.ReactNode; allowedRole?: string }) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }

  let role: string | undefined;
  try {
    const user = JSON.parse(userStr);
    role = user.role;
  } catch {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && role !== allowedRole) {
    return <Navigate to={role === 'admin' ? '/hr/dashboard' : '/mentor/dashboard'} replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* HR Admin Routes */}
        <Route 
          path="/hr" 
          element={
            <ProtectedRoute allowedRole="admin">
              <DashboardLayout />
            </ProtectedRoute>
          } 
        >
          <Route path="dashboard" element={<DashboardHome />} />
          <Route path="add-intern" element={<AddIntern />} />
          <Route path="unassigned" element={<UnassignedList />} />
          <Route path="ongoing" element={<OngoingList />} />
          <Route path="scientists" element={<ScientistsList />} />
          <Route path="completed" element={<CompletedList />} />
          <Route path="certificates" element={<CertificatesPage />} />
          <Route path="attendance" element={<AttendancePage />} />
        </Route>

        {/* Mentor Routes */}
        <Route 
          path="/mentor" 
          element={
            <ProtectedRoute allowedRole="mentor">
              <MentorDashboardLayout />
            </ProtectedRoute>
          } 
        >
          <Route path="dashboard" element={<MentorDashboardHome />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="passes" element={<MentorPassRequests />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
