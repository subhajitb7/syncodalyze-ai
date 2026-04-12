import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext, useEffect } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketPubSubProvider } from './context/SocketPubSubContext';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import VerifyOtp from './pages/VerifyOtp';
import Dashboard from './pages/Dashboard';
import NewReview from './pages/NewReview';
import ReviewDetail from './pages/ReviewDetail';
import ReviewHistory from './pages/ReviewHistory';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import FileViewer from './pages/FileViewer';

import AdminPanel from './pages/AdminPanel';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Teams from './pages/Teams';
import TeamDetail from './pages/TeamDetail';
import Profile from './pages/Profile';
import SecurityUpdate from './pages/SecurityUpdate';
import AiChatFloating from './components/AiChatFloating';
import Footer from './components/Footer';

import axios from 'axios';
// Connectivity standardization: Using the current origin allows the Vite proxy to handle routing.
const API_URL = '';
axios.defaults.baseURL = API_URL;
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
  const { user } = useContext(AuthContext);
  return (
    <Router>
      <div className="min-h-screen bg-main text-main flex flex-col transition-colors duration-300">
        <Navbar />
        <main className="flex-grow flex flex-col min-h-0 pt-16">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/security-update" element={<PrivateRoute><SecurityUpdate /></PrivateRoute>} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/new-review" element={<PrivateRoute><NewReview /></PrivateRoute>} />
            <Route path="/review/:id" element={<PrivateRoute><ReviewDetail /></PrivateRoute>} />
            <Route path="/reviews" element={<PrivateRoute><ReviewHistory /></PrivateRoute>} />
            <Route path="/projects" element={<PrivateRoute><Projects /></PrivateRoute>} />
            <Route path="/projects/:id" element={<PrivateRoute><ProjectDetail /></PrivateRoute>} />
            <Route path="/projects/:id/files/:fileId" element={<PrivateRoute><FileViewer /></PrivateRoute>} />
            <Route path="/analytics" element={<Navigate to="/dashboard" replace />} />
            <Route path="/teams" element={<PrivateRoute><Teams /></PrivateRoute>} />
            <Route path="/teams/:id" element={<PrivateRoute><TeamDetail /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
          </Routes>
        </main>
        {user && <Footer />}
        {user && <AiChatFloating />}
      </div>
    </Router>
  );
}

function App() {
  useEffect(() => {
    // Legacy host redirect logic removed for stability
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketPubSubProvider>
          <AppContent />
        </SocketPubSubProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
