import React, { useState } from 'react';
import { Inbox, Upload, Download, Calendar, Sparkles, MessageSquare, Award, Star } from 'lucide-react';

const ACTION_ICON_MAP = {
  material_upload:     { Icon: Upload,        cls: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
  material_downloaded: { Icon: Download,      cls: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' },
  daily_login:         { Icon: Calendar,      cls: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' },
  ai_conversation:     { Icon: Sparkles,      cls: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' },
  chat_message:        { Icon: MessageSquare, cls: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' },
  badge_unlocked:      { Icon: Award,         cls: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' },
};

const PointsHistory = ({ history }) => {
  const [dateFilter, setDateFilter] = useState('All time');

  // Using mock filter logic just for visual interactivity
  const filteredHistory = history.filter(item => {
    if (dateFilter === 'Last 7 days') return item.id <= 7; // Just a mock slice
    if (dateFilter === 'Last 30 days') return item.id <= 12;
    return true;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
      <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-gray-800">Points Activity</h2>
        
        <select 
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none cursor-pointer hover:bg-gray-100 transition-colors"
        >
          <option>Last 7 days</option>
          <option>Last 30 days</option>
          <option>All time</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[500px] p-2">
        {filteredHistory.length > 0 ? (
          <div className="space-y-1">
            {filteredHistory.map((item) => {
              const { Icon, cls } = ACTION_ICON_MAP[item.action] || { Icon: Star, cls: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400' };
              return (
              <div
                key={item.id}
                className="flex flex-row items-center justify-between p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors group border border-transparent hover:border-gray-100 dark:hover:border-gray-700"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 ${cls}`}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.timeStr}</p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center animate-in slide-in-from-right-2">
                  <div className={`font-bold text-base sm:text-lg px-3 py-1 rounded-lg ${
                    item.points > 0 ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30' : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30'
                  }`}>
                    {item.points > 0 ? '+' : ''}{item.points}
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-500">
            <Inbox className="w-12 h-12 mb-4 text-gray-200 dark:text-gray-700" />
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">No point activity yet.</p>
            <p className="text-sm max-w-[250px] text-gray-500 dark:text-gray-400">Start earning points by uploading materials, chatting with peers, and using the AI assistant!</p>
          </div>
        )}
      </div>

      {filteredHistory.length > 0 && (
        <div className="p-4 border-t border-gray-50 w-full mt-auto">
          <button className="w-full py-2 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
            Load More Activity
          </button>
        </div>
      )}
    </div>
  );
};

export default PointsHistory;
