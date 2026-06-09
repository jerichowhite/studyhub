// Route guard for pages that require a fully authenticated + verified + profiled user.
// Redirect chain: no user → /login | unverified email → /verify-email | no profile → /profile-setup

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children }) => {
  const { currentUser, profileComplete, loading } = useAuth();

  if (loading) return <LoadingSpinner fullPage />;

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!currentUser.emailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  if (!profileComplete) {
    return <Navigate to="/profile-setup" replace />;
  }

  return children;
};

export default ProtectedRoute;
