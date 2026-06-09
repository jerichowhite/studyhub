import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Moon, Sun, Bell, User, Settings, HelpCircle, LogOut } from 'lucide-react';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { logoutUser } from '../../services/authService';
import NotificationPanel from './NotificationPanel';

const Topbar = () => {
  const { currentUser, userProfile: userData } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [isDropdownOpen,     setIsDropdownOpen]     = useState(false);
  const [showNotifications,  setShowNotifications]  = useState(false);
  const [unreadCount,        setUnreadCount]        = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser?.uid) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid),
      where('read',   '==', false)
    );

    const unsub = onSnapshot(
      q,
      (snap) => setUnreadCount(snap.size),
      (err)  => console.error('Notification count listener error:', err)
    );

    return () => unsub();
  }, [currentUser?.uid]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const points = userData?.points || 0;

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 shadow-sm z-50 flex items-center justify-between px-4 md:px-6 transition-all duration-200">

      {/* Left: Logo & Brand */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
          <span className="text-white font-bold text-lg">S</span>
        </div>
        <span className="text-blue-800 dark:text-blue-400 font-bold text-xl hidden md:block tracking-tight">StudyHub</span>
      </div>

      {/* Right: Points, Theme Toggle, Notifications, Avatar */}
      <div className="flex items-center gap-3 relative">

        {/* Points Badge */}
        <div className="hidden sm:flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-full border border-blue-100 dark:border-blue-800 shadow-sm transition-transform hover:scale-105 cursor-default">
          <span className="text-lg">🏆</span>
          <span className="text-blue-700 dark:text-blue-300 font-semibold text-sm">{points} pts</span>
        </div>

        {/* Dark/Light Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="relative p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 border border-gray-200 dark:border-gray-600"
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? (
            <Sun className="h-5 w-5 text-yellow-400" />
          ) : (
            <Moon className="h-5 w-5 text-gray-600" />
          )}
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications((v) => !v);
              setIsDropdownOpen(false);
            }}
            className="relative p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors flex items-center justify-center"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />

            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white dark:border-gray-900">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <NotificationPanel
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
          />
        </div>

        {/* User Avatar */}
        <button
          onClick={() => { setIsDropdownOpen((v) => !v); setShowNotifications(false); }}
          className="relative rounded-full h-10 w-10 border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center bg-gray-100 dark:bg-gray-700"
        >
          {currentUser?.photoURL ? (
            <img
              src={currentUser.photoURL}
              alt="Profile"
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <span className="text-gray-600 dark:text-gray-200 font-medium text-sm">
              {userData?.displayName?.charAt(0) || currentUser?.email?.charAt(0).toUpperCase() || 'U'}
            </span>
          )}
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
            <div className="absolute top-12 right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-1 flex flex-col z-50 animate-in fade-in slide-in-from-top-2 overflow-hidden cursor-default">

              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50">
                <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{userData?.displayName || 'User'}</p>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate mt-0.5">{currentUser?.email}</p>
              </div>

              <div className="py-1.5 flex flex-col">
                <button onClick={() => { navigate('/profile');   setIsDropdownOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-700 dark:hover:text-blue-400 transition-colors flex items-center justify-start gap-3">
                  <User className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  My Profile
                </button>
                <button onClick={() => { navigate('/settings');  setIsDropdownOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-700 dark:hover:text-blue-400 transition-colors flex items-center justify-start gap-3">
                  <Settings className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  Settings
                </button>
                <button onClick={() => { navigate('/help');      setIsDropdownOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-700 dark:hover:text-blue-400 transition-colors flex items-center justify-start gap-3">
                  <HelpCircle className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  Help & Support
                </button>
              </div>

              <div className="border-t border-gray-100 dark:border-gray-700 py-1">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 transition-colors flex items-center justify-start gap-3 group"
                >
                  <LogOut className="w-4 h-4 text-red-400 group-hover:text-red-600" />
                  Sign Out
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export default Topbar;
