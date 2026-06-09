import { useEffect, useRef, useState, useCallback } from 'react';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

const withDateSeparators = (messages) => {
  const result = [];
  let lastDate = null;

  messages.forEach((msg) => {
    if (!msg.timestamp) { result.push(msg); return; }
    const d = new Date(typeof msg.timestamp === 'number' ? msg.timestamp : msg.timestamp);
    const dateStr = d.toDateString();
    if (dateStr !== lastDate) {
      lastDate = dateStr;
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      const label = dateStr === today ? 'Today' : dateStr === yesterday ? 'Yesterday' : d.toLocaleDateString();
      result.push({ id: `sep_${dateStr}`, type: 'system', text: label });
    }
    result.push(msg);
  });

  return result;
};

const ChatTopBar = ({ room, onOpenSidebar, onOpenUsers }) => (
  <div className="flex items-center gap-3 px-4 h-[60px] border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0">
    <button
      onClick={onOpenSidebar}
      className="md:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 shrink-0"
      aria-label="Back"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
    </button>

    <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
      {room?.isDM
        ? (room.name || '?').charAt(0).toUpperCase()
        : room?.courseCode?.replace(/\s+/g, '').substring(0, 4) || '💬'
      }
    </div>

    <div className="flex-1 min-w-0">
      <p className="font-bold text-gray-800 dark:text-white text-sm truncate">{room?.name || 'Select a conversation'}</p>
      {room?.isDM ? (
        <p className="text-xs text-green-500 dark:text-green-400 font-medium">Online</p>
      ) : (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {room?.onlineCount || 0} members online
        </p>
      )}
    </div>

    <button
      onClick={onOpenUsers}
      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 shrink-0"
      aria-label="Room info"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </button>
  </div>
);

const TypingIndicator = ({ typers }) => {
  if (!typers?.length) return null;
  const names = typers.map((t) => t.name || 'Someone').join(', ');
  return (
    <div className="flex items-center gap-2 px-4 py-1.5 text-xs text-gray-500 dark:text-gray-400 italic">
      <span className="flex gap-0.5">
        {[0,1,2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </span>
      {names} {typers.length === 1 ? 'is' : 'are'} typing…
    </div>
  );
};

const ChatWindow = ({
  activeRoom,
  messages,
  currentUser,
  typers,
  onSendMessage,
  onTyping,
  onDeleteMessage,
  onOpenSidebar,
  onOpenUsers,
}) => {
  const bottomRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, typers, autoScroll]);

  const handleScroll = useCallback((e) => {
    const el = e.currentTarget;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    setAutoScroll(nearBottom);
  }, []);

  if (!activeRoom) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-gray-900 text-center px-8">
        <div className="text-6xl mb-4">💬</div>
        <h3 className="font-bold text-gray-700 dark:text-gray-200 text-xl mb-2">Welcome to Peer Chat</h3>
        <p className="text-gray-400 dark:text-gray-500 text-sm max-w-xs">
          Select a course chat room or direct message from the left sidebar to start chatting with your classmates.
        </p>
      </div>
    );
  }

  const enriched = withDateSeparators(messages || []);
  const isGroup = !activeRoom.isDM;

  const canDelete = (msg) => {
    if (!msg.timestamp) return false;
    return Date.now() - msg.timestamp < 5 * 60 * 1000;
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      <ChatTopBar
        room={activeRoom}
        onOpenSidebar={onOpenSidebar}
        onOpenUsers={onOpenUsers}
      />

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50 dark:bg-gray-900"
        onScroll={handleScroll}
      >
        {enriched.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-5xl mb-3">👋</div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">No messages yet. Say hi!</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
              {isGroup ? 'Be the first to send a message in this room.' : 'Start your conversation.'}
            </p>
          </div>
        ) : (
          enriched.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.senderId === currentUser?.uid}
              isGroup={isGroup}
              onDelete={() => onDeleteMessage && onDeleteMessage(msg.id)}
              canDelete={canDelete(msg)}
            />
          ))
        )}

        <TypingIndicator typers={typers} />
        <div ref={bottomRef} />
      </div>

      {/* Message input */}
      <MessageInput
        onSend={onSendMessage}
        onTyping={onTyping}
        autoFocus={!!activeRoom}
      />
    </div>
  );
};

export default ChatWindow;
