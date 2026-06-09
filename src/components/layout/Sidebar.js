import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Trophy,
  Sparkles,
  MessageSquare,
  FolderOpen,
  BookOpen,
  Map,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { userProfile: userData } = useAuth();

  const navItems = [
    { name: 'Dashboard',   path: '/dashboard',   Icon: LayoutDashboard },
    { name: 'Achievements', path: '/gamification', Icon: Trophy },
    { name: 'AI Tutor',    path: '/ai-chat',      Icon: Sparkles },
    { name: 'Peer Chat',   path: '/peer-chat',    Icon: MessageSquare, badge: 3 },
    { name: 'Materials',   path: '/materials',    Icon: FolderOpen },
    { name: 'Study Area',  path: '/study-area',   Icon: BookOpen },
    { name: 'Campus Map',  path: '/campus-map',   Icon: Map },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 h-[calc(100vh-4rem)] bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-700 fixed top-16 left-0 overflow-y-auto">
      <div className="flex-1 py-6 px-4 space-y-1">
        {navItems.map(({ name, path, Icon, badge }) => (
          <NavLink
            key={name}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative
              ${isActive
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-800 hover:text-blue-700 dark:hover:text-blue-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="font-medium">{name}</span>
                {badge && (
                  <span className={`absolute right-4 ml-auto text-xs font-bold px-2 py-0.5 rounded-full
                    ${isActive ? 'bg-white text-blue-600' : 'bg-red-500 text-white'}
                  `}>
                    {badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* User Mini Profile Card */}
      <div className="p-4 mx-4 mb-6 mt-auto bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold border-2 border-white dark:border-gray-700 shadow-sm overflow-hidden">
             {userData?.displayName?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {userData?.displayName || 'Loading...'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {userData?.department || 'Student'}
            </p>
          </div>
        </div>
        <div className="flex justify-between items-center bg-white dark:bg-gray-700 p-2 rounded-lg border border-gray-100 dark:border-gray-600">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Level</span>
            <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/40 px-2 py-1 rounded-md">
                 {userData?.level || 'Scholar'}
            </span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
