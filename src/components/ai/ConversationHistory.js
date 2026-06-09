import React, { useState } from 'react';
import { Search, Plus, Compass } from 'lucide-react';

const ConversationHistory = ({ history, activeId, onSelectConversation, onNewChat }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHistory = history.filter(chat =>
    chat.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full h-full bg-white dark:bg-gray-800 flex flex-col border-r border-gray-100 dark:border-gray-700">

      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-50 dark:border-gray-700 flex flex-col gap-4">
        <button
          onClick={onNewChat}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Chat
        </button>

        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:bg-white dark:focus:bg-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 font-medium"
          />
        </div>
      </div>

      {/* List Container */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">

        {filteredHistory.length > 0 ? (
          filteredHistory.map((chat) => {
            const isActive = chat.id === activeId;
            return (
              <button
                key={chat.id}
                onClick={() => onSelectConversation(chat.id)}
                className={`w-full text-left p-3 flex flex-col gap-1.5 rounded-lg transition-colors border ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-700 shadow-[0_2px_10px_-4px_rgba(37,99,235,0.2)]'
                    : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <div className="flex justify-between items-start gap-2 w-full">
                  <h4 className={`font-semibold text-sm truncate flex-1 ${isActive ? 'text-blue-800 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200'}`}>
                    {chat.title}
                  </h4>
                  {chat.unread && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1"></span>}
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 truncate font-medium">
                  {chat.preview}
                </p>

                <div className="flex justify-between items-center mt-1">
                   <div className="flex gap-1 overflow-hidden">
                     {chat.topics && chat.topics.map((t, idx) => (
                       <span key={idx} className="text-[9px] bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded uppercase font-bold shrink-0 line-clamp-1 max-w-[80px]">
                         {t}
                       </span>
                     ))}
                   </div>
                   <span className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold shrink-0 ml-2">{chat.date}</span>
                </div>
              </button>
            )
          })
        ) : (
          <div className="p-6 text-center text-gray-400 flex flex-col items-center">
             <Compass className="w-10 h-10 mb-2 opacity-40 text-gray-400 dark:text-gray-500" />
             <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No conversations found.</p>
             {searchTerm === '' && (
                <p className="text-xs mt-1 text-gray-400 dark:text-gray-500">Start chatting to log history!</p>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationHistory;
