import { Flame, Trophy, FolderOpen, Sparkles } from 'lucide-react';

const QuickStats = ({ userData }) => {
  const points    = userData?.points || 0;
  const streak    = userData?.stats?.loginStreak    || 0;
  const materials = userData?.stats?.materialsUploaded || 0;
  const aiChats   = userData?.stats?.aiConversations  || 0;

  const stats = [
    {
      id: 1,
      title: 'Day Streak',
      value: streak.toString(),
      Icon: Flame,
      subtext: streak > 0 ? 'Keep it going!' : 'Log in daily to build a streak',
      iconClass: 'bg-orange-100 dark:bg-orange-900/30 text-orange-500 dark:text-orange-400',
    },
    {
      id: 2,
      title: 'Total Points',
      value: points.toString(),
      Icon: Trophy,
      subtext: points === 0 ? 'Start earning today!' : null,
      iconClass: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-500 dark:text-yellow-400',
    },
    {
      id: 3,
      title: 'Materials Shared',
      value: materials.toString(),
      Icon: FolderOpen,
      subtext: materials === 0 ? 'Upload your first material' : `${materials} contribution${materials !== 1 ? 's' : ''}`,
      iconClass: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    },
    {
      id: 4,
      title: 'AI Chats',
      value: aiChats.toString(),
      Icon: Sparkles,
      subtext: aiChats === 0 ? 'Start your first AI chat' : `${aiChats} conversation${aiChats !== 1 ? 's' : ''}`,
      iconClass: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
      {stats.map(({ id, title, value, Icon, subtext, iconClass }) => (
        <div
          key={id}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 transition-all duration-300 hover:shadow-md hover:-translate-y-1 group"
        >
          <div className="flex justify-between items-start mb-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconClass} transition-transform group-hover:scale-110`}>
              <Icon className="w-6 h-6" />
            </div>
          </div>
          <div>
            <h3 className="text-gray-500 dark:text-gray-400 font-medium text-sm mb-1">{title}</h3>
            <div className="text-2xl font-bold text-gray-800 dark:text-white mb-1">{value}</div>
            {subtext && (
              <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">{subtext}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default QuickStats;
