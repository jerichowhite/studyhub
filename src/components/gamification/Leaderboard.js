import { useState } from 'react';
import { Trophy, Medal } from 'lucide-react';
import EmptyState from '../common/EmptyState';

const TopThreeCard = ({ user, position }) => {
  const medals = {
    1: { cardClass: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-400 dark:border-yellow-600', iconClass: 'text-yellow-500', ring: 'ring-yellow-400', size: 'scale-110 z-10' },
    2: { cardClass: 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-500',            iconClass: 'text-gray-400',   ring: 'ring-gray-300',   size: 'mt-4'          },
    3: { cardClass: 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-600', iconClass: 'text-orange-400', ring: 'ring-orange-400', size: 'mt-6'          },
  };
  const m = medals[position];

  return (
    <div className={`relative flex flex-col items-center p-4 rounded-2xl border-2 bg-white dark:bg-gray-800 shadow-sm transition-transform hover:-translate-y-1 ${m.cardClass} ${m.size}`}>
      <span className="absolute -top-4 rounded-full bg-white dark:bg-gray-800 shadow-sm p-1">
        <Medal className={`w-6 h-6 ${m.iconClass}`} />
      </span>
      <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-xl font-bold bg-gray-200 dark:bg-gray-600 mt-2 ring-4 ring-offset-2 ${m.ring} shadow-md overflow-hidden`}>
        {user.avatar
          ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          : user.name.charAt(0)}
      </div>
      <h4 className="font-bold text-gray-800 dark:text-white mt-4 text-center text-sm md:text-base line-clamp-1">{user.name}</h4>
      <div className="bg-white/80 dark:bg-gray-700/80 backdrop-blur px-3 py-1 rounded-full mt-2 font-black text-gray-900 dark:text-white border shadow-sm">
        {user.points} <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">pts</span>
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mt-2 bg-white dark:bg-gray-700 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-600">
        Level {user.level}
      </span>
    </div>
  );
};

const LeaderboardRow = ({ user, rank, isCurrentUser }) => (
  <div className={`flex items-center gap-3 md:gap-4 p-3 border-b dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors relative ${isCurrentUser ? 'bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-100/50 dark:hover:bg-blue-900/30' : ''}`}>
    {isCurrentUser && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-md" />}
    <div className="w-6 text-center font-bold text-gray-500 dark:text-gray-400 shrink-0">#{rank}</div>
    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 shrink-0 border border-blue-200 dark:border-blue-700 overflow-hidden">
      {user.avatar
        ? <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
        : user.name.charAt(0)}
    </div>
    <div className="flex-1 min-w-0">
      <h4 className={`font-bold text-sm truncate ${isCurrentUser ? 'text-blue-800 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200'}`}>
        {user.name}
        {isCurrentUser && (
          <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded uppercase ml-2">You</span>
        )}
      </h4>
      {user.department && (
        <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block truncate">{user.department}</p>
      )}
    </div>
    <div className="text-right shrink-0">
      <div className="font-bold text-gray-800 dark:text-white">{user.points} pts</div>
      <div className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded inline-block px-1 mt-0.5">
        Lv {user.level}
      </div>
    </div>
  </div>
);

const Leaderboard = ({ users = [], currentUserId, currentUserCourses = [] }) => {
  const [activeTab, setActiveTab] = useState('allTime');

  const dataToRender = users;
  const topThree  = dataToRender.slice(0, 3);
  const remaining = dataToRender.slice(3, 10);

  const currentUserEntry = dataToRender.find((u) => u.id === currentUserId);
  const isCurrentUserVisible =
    remaining.some((u) => u.id === currentUserId) ||
    topThree.some((u) => u.id === currentUserId);

  const tabs = [
    { id: 'allTime', label: 'All-Time', Icon: Trophy },
    { id: 'weekly',  label: 'Weekly',   Icon: Medal },
    { id: 'course',  label: 'Course',   Icon: Medal },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-full overflow-hidden">

      {/* Tabs */}
      <div className="pt-2 px-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
        <div className="flex p-2 gap-2 overflow-x-auto pb-0 hide-scrollbar">
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
                activeTab === id
                  ? 'border-blue-600 text-blue-700 dark:text-blue-400 bg-white dark:bg-gray-800 rounded-t-lg shadow-[0_-4px_6px_-2px_rgba(0,0,0,0.02)]'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-t-lg'
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Sub-header */}
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 border-b border-gray-50 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-black text-gray-800 dark:text-white">
            {activeTab === 'weekly'  && 'Top Students This Week'}
            {activeTab === 'course'  && 'Course Leaderboard'}
            {activeTab === 'allTime' && 'All-Time Hall of Fame'}
          </h2>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-0.5">
            {activeTab === 'weekly'  && 'Ranked by total points'}
            {activeTab === 'course'  && (currentUserCourses.length > 0 ? currentUserCourses[0] : 'Top contributors')}
            {activeTab === 'allTime' && `${users.length} student${users.length !== 1 ? 's' : ''} ranked`}
          </p>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon={Trophy}
            title="No rankings yet"
            message="Be the first to earn points and claim the top spot!"
          />
        </div>
      ) : (
        <>
          {/* Podium */}
          <div className="bg-gradient-to-b from-blue-50/50 dark:from-blue-900/10 to-white dark:to-gray-800 px-4 py-8 border-b border-gray-50 dark:border-gray-700">
            <div className="flex justify-center items-end gap-2 sm:gap-6 max-w-lg mx-auto">
              {topThree[1] && <TopThreeCard user={topThree[1]} position={2} />}
              {topThree[0] && <TopThreeCard user={topThree[0]} position={1} />}
              {topThree[2] && <TopThreeCard user={topThree[2]} position={3} />}
            </div>
          </div>

          {/* Rest of list */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-2 sm:p-4">
              {remaining.map((user) => (
                <LeaderboardRow
                  key={user.id}
                  user={user}
                  rank={user.rank}
                  isCurrentUser={user.id === currentUserId}
                />
              ))}
            </div>
          </div>

          {/* Sticky current-user row */}
          {!isCurrentUserVisible && currentUserEntry && (
            <div className="border-t-2 border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-800 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] p-2 sm:p-4 z-10">
              <LeaderboardRow user={currentUserEntry} rank={currentUserEntry.rank} isCurrentUser />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Leaderboard;
