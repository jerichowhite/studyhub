import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Upload, MessageSquare, Trophy } from 'lucide-react';

const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      id: 1,
      label: 'Ask AI Assistant',
      Icon: Sparkles,
      path: '/ai-chat',
      colorClass: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/40 border-purple-100 dark:border-purple-800',
    },
    {
      id: 2,
      label: 'Upload Materials',
      Icon: Upload,
      path: '/materials',
      colorClass: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 border-blue-100 dark:border-blue-800',
    },
    {
      id: 3,
      label: 'Join Study Chat',
      Icon: MessageSquare,
      path: '/peer-chat',
      colorClass: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border-emerald-100 dark:border-emerald-800',
    },
    {
      id: 4,
      label: 'View Leaderboard',
      Icon: Trophy,
      path: '/gamification',
      colorClass: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 border-amber-100 dark:border-amber-800',
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-full p-5 relative">
      <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Quick Actions</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {actions.map(({ id, label, Icon, path, colorClass }) => (
          <button
            key={id}
            onClick={() => navigate(path)}
            className={`flex flex-col items-center justify-center p-6 rounded-xl border transition-all duration-200 group ${colorClass}`}
          >
            <Icon className="w-9 h-9 mb-3 transition-transform group-hover:scale-125 group-active:scale-95" />
            <span className="font-semibold text-sm text-center">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
