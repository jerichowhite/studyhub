// Global authentication state management for StudyHub.
// Wraps the app and provides currentUser, userProfile, and loading state
// to any component via the useAuth() hook.

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { getUserProfile } from '../services/userService';

const AuthContext = createContext(null);

/**
 * Custom hook to access auth context.
 * Must be called inside a component wrapped by <AuthProvider>.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  // Firebase user object (or null if signed out)
  const [currentUser, setCurrentUser] = useState(null);
  // Firestore profile document (or null if not yet created / not loaded)
  const [userProfile, setUserProfile] = useState(null);
  // True while we are waiting for the initial auth state from Firebase
  const [loading, setLoading] = useState(true);

  /**
   * Manually re-fetches the Firestore profile.
   * Call this after completing profile setup or updating profile data.
   */
  const refreshProfile = useCallback(async () => {
    if (auth.currentUser) {
      try {
        const profile = await getUserProfile(auth.currentUser.uid);
        setUserProfile(profile);
      } catch {
        setUserProfile(null);
      }
    }
  }, []);

  useEffect(() => {
    // Firebase fires this once on mount with the current session, then on every change.
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
        } catch {
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    // Clean up the listener when the provider unmounts
    return unsubscribe;
  }, []);

  // Derived boolean — true when a complete profile doc exists in Firestore
  const profileComplete = !!(userProfile?.profileCompleted);

  const value = {
    currentUser,
    userProfile,
    // Alias so ProfileSetup (and future code) can update profile state directly
    // without waiting for an async re-fetch, preventing the "re-enter details" bug.
    setUserData: setUserProfile,
    loading,
    refreshProfile,
    profileComplete,
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Render a full-screen spinner while we determine auth state.
          This prevents a flash of the login page for already-signed-in users. */}
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading StudyHub…</p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
