// Route guard for public pages (login, register, forgot-password).
// Redirects fully authenticated users (verified + profile complete) to the dashboard
// so they don't land on login/register by accident.

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const PublicRoute = ({ children }) => {
  const { currentUser, profileComplete, loading } = useAuth();

  if (loading) return <LoadingSpinner fullPage />;

  if (currentUser?.emailVerified && profileComplete) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default PublicRoute;
