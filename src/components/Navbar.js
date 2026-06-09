import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logoutUser } from '../services/authService';

const Navbar = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // A fully set-up user (verified + profile complete)
  const isFullyAuthenticated =
    currentUser?.emailVerified && userProfile?.profileCompleted;

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await logoutUser();
      navigate('/login', { replace: true });
    } catch {
      setSigningOut(false);
    }
  };

  const avatarLetter = (
    userProfile?.displayName ||
    currentUser?.email ||
    '?'
  )[0].toUpperCase();

  return (
    <nav className="bg-blue-700 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">

          {/* Logo */}
          <div className="flex items-center">
            <Link
              to={isFullyAuthenticated ? '/dashboard' : '/'}
              className="flex items-center gap-2 flex-shrink-0"
            >
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="font-bold text-white text-sm">S</span>
              </div>
              <span className="font-bold text-xl tracking-tight hidden sm:block">StudyHub</span>
            </Link>
          </div>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center space-x-1">
            {isFullyAuthenticated ? (
              /* ── Authenticated navigation ── */
              <>
                <Link
                  to="/dashboard"
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition"
                >
                  Dashboard
                </Link>

                {/* Profile menu */}
                <div className="relative ml-2 group">
                  <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-blue-600 transition focus:outline-none">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border border-white/30">
                      {userProfile?.photoURL ? (
                        <img
                          src={userProfile.photoURL}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-semibold text-white">{avatarLetter}</span>
                      )}
                    </div>
                    <span className="text-sm font-medium max-w-[120px] truncate">
                      {userProfile?.displayName || 'Account'}
                    </span>
                    <svg className="w-4 h-4 text-blue-200" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>

                  {/* Dropdown */}
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all z-50">
                    <div className="px-4 py-2.5 border-b border-gray-100">
                      <p className="text-xs text-gray-500">Signed in as</p>
                      <p className="text-sm font-medium text-gray-900 truncate">{currentUser?.email}</p>
                    </div>
                    <Link
                      to="/profile-settings"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                      </svg>
                      Profile Settings
                    </Link>
                    <button
                      onClick={handleSignOut}
                      disabled={signingOut}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                      </svg>
                      {signingOut ? 'Signing out…' : 'Sign Out'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* ── Unauthenticated navigation ── */
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-white/10 hover:bg-white/20 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-white text-blue-700 hover:bg-blue-50 transition"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="p-2 rounded-md text-blue-200 hover:text-white hover:bg-blue-600 transition focus:outline-none"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-blue-800 border-t border-blue-600 px-4 py-3 space-y-1">
          {isFullyAuthenticated ? (
            <>
              {/* User info */}
              <div className="flex items-center gap-3 px-3 py-2 mb-2">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border border-white/30">
                  {userProfile?.photoURL ? (
                    <img src={userProfile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-white">{avatarLetter}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {userProfile?.displayName || 'Student'}
                  </p>
                  <p className="text-xs text-blue-300 truncate">{currentUser?.email}</p>
                </div>
              </div>

              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-white hover:bg-blue-700 transition"
              >
                Dashboard
              </Link>
              <Link
                to="/profile-settings"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-white hover:bg-blue-700 transition"
              >
                Profile Settings
              </Link>
              <button
                onClick={() => { setMobileMenuOpen(false); handleSignOut(); }}
                disabled={signingOut}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-red-300 hover:bg-blue-700 transition disabled:opacity-50"
              >
                {signingOut ? 'Signing out…' : 'Sign Out'}
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-white hover:bg-blue-700 transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-semibold text-blue-700 bg-white hover:bg-blue-50 transition"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
