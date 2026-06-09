import { useState } from 'react';

const formatTime = (ts) => {
  if (!ts) return '';
  const d = typeof ts === 'number' ? new Date(ts) : ts?.toDate?.() ?? new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const MessageBubble = ({ message, isOwn, isGroup, onDelete, canDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleContextMenu = (e) => {
    e.preventDefault();
    setMenuOpen(true);
  };

  const closeMenu = () => setMenuOpen(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text).catch(() => {});
    closeMenu();
  };

  const handleDelete = () => {
    if (onDelete) onDelete(message.id);
    closeMenu();
  };

  if (message.type === 'system') {
    return (
      <div className="flex justify-center my-3">
        <span className="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs italic px-4 py-1 rounded-full">
          {message.text}
        </span>
      </div>
    );
  }

  const initials = (message.senderName || '?').charAt(0).toUpperCase();

  return (
    <div
      className={`flex items-end gap-2 mb-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
      onContextMenu={handleContextMenu}
      onClick={() => menuOpen && closeMenu()}
    >
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-xs shrink-0 overflow-hidden border border-gray-200 dark:border-gray-600">
        {message.senderAvatar ? (
          <img src={message.senderAvatar} alt={message.senderName} className="w-full h-full object-cover" />
        ) : (
          initials
        )}
      </div>

      <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {isGroup && !isOwn && (
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1 px-1">{message.senderName}</span>
        )}

        {/* Bubble */}
        <div
          className={`relative px-3 py-2 rounded-2xl shadow-sm text-sm leading-relaxed break-words
            ${isOwn
              ? 'bg-blue-600 text-white rounded-tr-none'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-tl-none'
            }
            ${message.deleted ? 'italic opacity-60' : ''}
          `}
        >
          {message.text}
        </div>

        {/* Timestamp */}
        <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 px-1">
          {formatTime(message.timestamp)}
        </span>
      </div>

      {/* Context menu */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeMenu} />
          <div
            className={`absolute z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl py-1 text-sm min-w-[140px]
              ${isOwn ? 'right-10' : 'left-10'}
            `}
            style={{ bottom: '2rem' }}
          >
            <button
              onClick={handleCopy}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
            >
              Copy message
            </button>
            {isOwn && canDelete && !message.deleted && (
              <button
                onClick={handleDelete}
                className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600"
              >
                Delete message
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default MessageBubble;
