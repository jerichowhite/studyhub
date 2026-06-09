import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Trophy,
  MessageSquare,
  FolderOpen,
  BookOpen,
  Map,
} from 'lucide-react';

const BottomNav = () => {
  const navItems = [
    { name: 'Home',  path: '/dashboard',   Icon: LayoutDashboard },
    { name: 'Goals', path: '/gamification', Icon: Trophy },
    { name: 'Chat',  path: '/peer-chat',    Icon: MessageSquare,  badge: 3 },
    { name: 'Files', path: '/materials',    Icon: FolderOpen },
    { name: 'Study', path: '/study-area',   Icon: BookOpen },
    { name: 'Map',   path: '/campus-map',   Icon: Map },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[70px] bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-around items-center px-2 pb-safe z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      {navItems.map(({ name, path, Icon, badge }) => (
        <NavLink
          key={name}
          to={path}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-full h-full relative transition-colors duration-200
            ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400'}`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-blue-600 dark:bg-blue-400 rounded-b-md" />
              )}
              <div className="relative mb-1">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? '-translate-y-0.5' : ''}`} />
                {badge && (
                  <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white dark:border-gray-900">
                    {badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium ${isActive ? 'font-semibold' : ''}`}>
                {name}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;
