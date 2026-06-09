import { useState } from 'react';
import { Globe, X } from 'lucide-react';
import UserStatusIndicator from './UserStatusIndicator';
import EmptyState from '../common/EmptyState';

// Props:
//   onlineUsers  – [{ id, name, department, level, online:true }]
//   offlineUsers – [{ id, name, department, level, lastSeen, online:false }]
//   onStartDM    – fn(user)
//   onClose      – fn()

const OnlineUsersList = ({ onlineUsers = [], offlineUsers = [], onStartDM, onClose }) => {
  const [offlineOpen, setOfflineOpen] = useState(false);
  const [search,      setSearch]      = useState('');

  const filtered = (arr) =>
    !search ? arr : arr.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()));

  const visibleOnline  = filtered(onlineUsers);
  const visibleOffline = filtered(offlineUsers);

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 shrink-0">
        <div>
          <h2 className="font-bold text-gray-800 text-sm">Online Members</h2>
          <p className="text-xs text-green-600 font-medium mt-0.5">{onlineUsers.length} online</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search */}
      <div className="px-4 py-2 border-b border-gray-50 shrink-0">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find member…"
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-2">
        {visibleOnline.length === 0 ? (
          <EmptyState
            icon={Globe}
            title="No one online right now"
            message="Members appear here when they're active in this room."
          />
        ) : (
          visibleOnline.map((user) => (
            <UserCard key={user.id} user={user} onStartDM={onStartDM} />
          ))
        )}

        {visibleOffline.length > 0 && (
          <div className="mt-3">
            <button
              onClick={() => setOfflineOpen((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <span>Recently Seen ({visibleOffline.length})</span>
              <svg
                className={`w-3 h-3 transition-transform ${offlineOpen ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {offlineOpen && visibleOffline.map((user) => (
              <UserCard key={user.id} user={user} onStartDM={onStartDM} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const UserCard = ({ user, onStartDM }) => (
  <div className="group flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 transition-colors cursor-default">
    <div className="relative shrink-0">
      <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm overflow-hidden border-2 border-white shadow-sm">
        {user.avatar
          ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          : user.name.charAt(0).toUpperCase()}
      </div>
      <UserStatusIndicator online={user.online} size="sm" className="absolute -bottom-0.5 -right-0.5" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-gray-800 truncate">{user.name}</p>
      <p className="text-[10px] text-gray-400 truncate">
        {user.online
          ? [user.department, user.level && `L${user.level}`].filter(Boolean).join(' · ')
          : `Last seen: ${user.lastSeen}`}
      </p>
    </div>
    {onStartDM && (
      <button
        onClick={() => onStartDM(user)}
        className="opacity-0 group-hover:opacity-100 shrink-0 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg transition-all"
      >
        MSG
      </button>
    )}
  </div>
);

export default OnlineUsersList;
