import React, { useState } from 'react';
import {
  Award, User, BookOpen, Users, Zap, Lightbulb, Bot,
  Flame, Target, TrendingUp, Sun, Moon, Star, Lock,
} from 'lucide-react';

const BADGE_ICON_MAP = {
  first_steps:       { Icon: Award,       color: 'text-gray-500' },
  profile_complete:  { Icon: User,        color: 'text-blue-500' },
  helper:            { Icon: Award,       color: 'text-yellow-500' },
  knowledge_sharer:  { Icon: BookOpen,    color: 'text-blue-600' },
  community_builder: { Icon: Users,       color: 'text-green-500' },
  ai_explorer:       { Icon: Zap,         color: 'text-purple-500' },
  curious_mind:      { Icon: Lightbulb,   color: 'text-yellow-400' },
  study_partner:     { Icon: Bot,         color: 'text-blue-500' },
  consistent:        { Icon: Flame,       color: 'text-orange-500' },
  dedicated:         { Icon: Target,      color: 'text-red-500' },
  unstoppable:       { Icon: TrendingUp,  color: 'text-blue-600' },
  early_bird:        { Icon: Sun,         color: 'text-yellow-500' },
  night_owl:         { Icon: Moon,        color: 'text-indigo-500' },
};

const rarityColors = {
  Common:    '#9CA3AF',
  Rare:      '#3B82F6',
  Epic:      '#8B5CF6',
  Legendary: '#F59E0B',
};

const BadgeDisplay = ({ badges }) => {
  const [filter, setFilter] = useState('All');

  const getFilteredBadges = () => {
    if (filter === 'Earned') return badges.filter(b => b.earned);
    if (filter === 'Locked') return badges.filter(b => !b.earned);
    return badges;
  };

  const filteredBadges = getFilteredBadges();
  const earnedCount = badges.filter(b => b.earned).length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-full p-6 flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Badges & Achievements</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            <span className="font-semibold text-blue-600 dark:text-blue-400">{earnedCount}</span> / {badges.length} badges earned
          </p>
        </div>

        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
          {['All', 'Earned', 'Locked'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                filter === f
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-300 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-gray-600/50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 overflow-y-auto max-h-[600px] p-1">
        {filteredBadges.map((badge) => {
          const { Icon, color } = BADGE_ICON_MAP[badge.id] || { Icon: Star, color: 'text-yellow-500' };
          return (
            <div
              key={badge.id}
              className={`relative rounded-xl border p-4 flex flex-col items-center text-center transition-all duration-300 transform hover:scale-105 group ${
                badge.earned
                  ? 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-600'
                  : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50'
              }`}
            >
              {!badge.earned && (
                <div className="absolute top-2 right-2 text-gray-400 dark:text-gray-500">
                  <Lock className="w-4 h-4" />
                </div>
              )}

              <div className="relative mb-3 flex items-center justify-center">
                <div
                  className={`w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-full transition-all duration-300 ${
                    badge.earned ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-gray-200 dark:bg-gray-600 opacity-50'
                  }`}
                  style={badge.earned ? { boxShadow: `0 0 15px -3px ${rarityColors[badge.rarity]}40 inset` } : {}}
                >
                  <Icon
                    className={`w-8 h-8 sm:w-10 sm:h-10 transition-transform duration-500 ${
                      badge.earned
                        ? `${color} group-hover:rotate-12 group-hover:scale-110`
                        : 'text-gray-400 dark:text-gray-500'
                    }`}
                  />
                </div>
              </div>

              <h4 className={`font-bold mb-1 text-sm ${badge.earned ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                {badge.name}
              </h4>

              <p className="text-xs font-semibold mb-2 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-600" style={{ color: badge.earned ? rarityColors[badge.rarity] : '#9CA3AF' }}>
                {badge.rarity}
              </p>

              <div className="mt-auto w-full">
                {badge.earned ? (
                  <>
                    <p className="text-xs text-gray-600 dark:text-gray-300 hidden group-hover:block mb-1 px-1 transition-all">
                      {badge.description}
                    </p>
                    <p className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 rounded-md py-1">
                      Earned {badge.earnedDate}
                    </p>
                  </>
                ) : (
                  <div className="w-full">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 min-h-[32px] line-clamp-2">
                      {badge.requirement}
                    </p>
                    {badge.progress && (
                      <div className="w-full">
                        <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400 mb-1 font-medium">
                          <span>Progress</span>
                          <span>{badge.progress.current} / {badge.progress.total}</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gray-400 dark:bg-gray-400 rounded-full transition-all duration-500"
                            style={{ width: `${(badge.progress.current / badge.progress.total) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredBadges.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500 dark:text-gray-400">
          <Star className="w-10 h-10 mb-3 opacity-30" />
          <p>No badges found for this filter.</p>
        </div>
      )}
    </div>
  );
};

export default BadgeDisplay;
