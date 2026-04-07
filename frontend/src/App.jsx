import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import VerifyOtp from './pages/VerifyOtp';
import Dashboard from './pages/Dashboard';
import NewReview from './pages/NewReview';
import ReviewDetail from './pages/ReviewDetail';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import FileViewer from './pages/FileViewer';
import Analytics from './pages/Analytics';
import AdminPanel from './pages/AdminPanel';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Teams from './pages/Teams';
import TeamDetail from './pages/TeamDetail';
import AiLogs from './pages/AiLogs';

// Axios global defaults
import axios from 'axios';
axios.defaults.baseURL = 'http://localhost:5001';
axios.defaults.withCredentials = true;

const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div className="h-screen w-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/auth" />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div className="h-screen w-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/auth" />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" />;
  return children;
};

function AppContent() {
  return (
    <Router>
      <div className="min-h-screen bg-dark-900 flex flex-col">
        <Navbar />
        <main className="flex-grow flex flex-col">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/new-review" element={<PrivateRoute><NewReview /></PrivateRoute>} />
            <Route path="/review/:id" element={<PrivateRoute><ReviewDetail /></PrivateRoute>} />
            <Route path="/projects" element={<PrivateRoute><Projects /></PrivateRoute>} />
            <Route path="/projects/:id" element={<PrivateRoute><ProjectDetail /></PrivateRoute>} />
            <Route path="/projects/:id/files/:fileId" element={<PrivateRoute><FileViewer /></PrivateRoute>} />
            <Route path="/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
            <Route path="/teams" element={<PrivateRoute><Teams /></PrivateRoute>} />
            <Route path="/teams/:id" element={<PrivateRoute><TeamDetail /></PrivateRoute>} />
            <Route path="/ai-logs" element={<PrivateRoute><AiLogs /></PrivateRoute>} />
            <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
