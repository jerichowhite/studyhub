import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Layout structure
import Navbar from './components/Navbar';
import AppLayout from './components/layout/AppLayout';

// Route guards
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import VerifyEmail from './pages/VerifyEmail';
import ProfileSetup from './pages/ProfileSetup';
import ProfileSettings from './pages/ProfileSettings';
import Dashboard from './pages/Dashboard';
import Gamification from './pages/Gamification';
import AIAssistant from './pages/AIAssistant';
import PeerChat from './pages/PeerChat';
import Materials from './pages/Materials';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import HelpSupport from './pages/HelpSupport';
import CampusMap from './pages/CampusMap';
import StudyArea from './pages/StudyArea';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App flex flex-col min-h-screen">
          <Routes>
            {/* ── Public routes (wrapped in div to isolate from AppLayout, with original Navbar) ── */}
            <Route path="/" element={<PublicRoute><><Navbar /><Home /></></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><><Navbar /><Login /></></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><><Navbar /><Register /></></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><><Navbar /><ForgotPassword /></></PublicRoute>} />

            {/* ── Semi-public: auth required but profile not yet complete ─────── */}
            <Route path="/verify-email" element={<><Navbar /><VerifyEmail /></>} />
            <Route path="/profile-setup" element={<><Navbar /><ProfileSetup /></>} />

            {/* ── Protected routes (fully authenticated + profile complete) ───── */}
            {/* Wrapped securely in AppLayout */}
            
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile-settings"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ProfileSettings />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route path="/profile" element={
              <ProtectedRoute>
                <AppLayout>
                  <Profile />
                </AppLayout>
              </ProtectedRoute>
            } />

            <Route path="/settings" element={
              <ProtectedRoute>
                <AppLayout>
                  <Settings />
                </AppLayout>
              </ProtectedRoute>
            } />

            <Route path="/help" element={
              <ProtectedRoute>
                <AppLayout>
                  <HelpSupport />
                </AppLayout>
              </ProtectedRoute>
            } />

            {/* Mock Protected Routes as requested to map out links */}
            <Route
              path="/ai-chat"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <AIAssistant />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/gamification"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Gamification />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/peer-chat"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <PeerChat />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/materials"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Materials />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Study Area – full screen, no AppLayout */}
            <Route
              path="/study-area"
              element={
                <ProtectedRoute>
                  <StudyArea />
                </ProtectedRoute>
              }
            />

            {/* Campus Map – full screen, no AppLayout */}
            <Route
              path="/campus-map"
              element={
                <ProtectedRoute>
                  <CampusMap />
                </ProtectedRoute>
              }
            />

            {/* ── Catch-all fallback ────────────────────────────────────────── */}
            {/* Redirect unknown routes to dashboard instead of / to ensure logged in users stay in app */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
