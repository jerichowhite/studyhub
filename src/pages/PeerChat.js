import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import ChatRoomList from '../components/chat/ChatRoomList';
import ChatWindow from '../components/chat/ChatWindow';
import OnlineUsersList from '../components/chat/OnlineUsersList';
import {
  sendMessage,
  subscribeToMessages,
  subscribeToRoomPresence,
  setUserOnline,
  setCurrentRoom,
  setTypingStatus,
  subscribeToTyping,
  deleteMessage,
  joinRoom,
  buildRoomId,
  initDMConversation,
} from '../services/chatService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const buildRoomsFromProfile = (profile) => {
  const courses = profile?.courses || [];

  return courses.map((courseStr) => {
    const [code = courseStr, ...rest] = courseStr.split(' - ');
    const name = rest.join(' - ') || code;
    const roomId = buildRoomId(
      profile?.university || 'biu',
      profile?.department || 'cs',
      profile?.level || '400',
      code
    );
    return {
      id: roomId,
      type: 'room',
      courseCode: code.trim(),
      name: `${code.trim()} - ${name.trim()}`,
      isDM: false,
    };
  });
};

// ─── PeerChat Page ─────────────────────────────────────────────────────────────

const PeerChat = () => {
  const { currentUser, userProfile } = useAuth();

  const [activeRoom,    setActiveRoom]    = useState(null);
  const [messages,      setMessages]      = useState([]);
  const [typers,        setTypers]        = useState([]);
  const [onlineUsers,   setOnlineUsers]   = useState([]);
  const [offlineUsers,  setOfflineUsers]  = useState([]);

  // Mobile drawer state
  const [showRoomList, setShowRoomList] = useState(false);
  const [showUsersList, setShowUsersList] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  // Track subscriptions to clean up
  const msgUnsubRef      = useRef(null);
  const typingUnsubRef   = useRef(null);
  const presenceUnsubRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const showToast = useCallback((msg, type = 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // ── On mount: set online, join course rooms ──────────────────────────────
  useEffect(() => {
    if (!currentUser?.uid) return;

    setUserOnline(currentUser.uid, userProfile).catch(console.error);

    // Auto-join all course rooms
    const rooms = buildRoomsFromProfile(userProfile);
    rooms.forEach((room) => {
      joinRoom(currentUser.uid, room.id, {
        roomName: room.name,
        courseCode: room.courseCode,
        department: userProfile?.department || 'CS',
        level: userProfile?.level || '400',
        university: userProfile?.university || 'BIU',
      }).catch(console.error);
    });

    return () => {
      // Firebase onDisconnect handles setting user offline automatically
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.uid]);

  // ── When active room changes: subscribe to messages + typing ─────────────
  useEffect(() => {
    // Tear down previous subscriptions
    if (msgUnsubRef.current)      { msgUnsubRef.current();      msgUnsubRef.current      = null; }
    if (typingUnsubRef.current)   { typingUnsubRef.current();   typingUnsubRef.current   = null; }
    if (presenceUnsubRef.current) { presenceUnsubRef.current(); presenceUnsubRef.current = null; }
    setMessages([]);
    setTypers([]);
    setOnlineUsers([]);
    setOfflineUsers([]);

    if (!activeRoom) return;

    // Update presence
    if (currentUser?.uid) {
      setCurrentRoom(currentUser.uid, activeRoom.id).catch(console.error);
    }

    // Subscribe to messages
    msgUnsubRef.current = subscribeToMessages(activeRoom.id, (msgs) => {
      setMessages(msgs);
    });

    // Subscribe to room presence (only for group rooms, not DMs)
    if (!activeRoom.isDM && currentUser?.uid) {
      presenceUnsubRef.current = subscribeToRoomPresence(
        activeRoom.id,
        currentUser.uid,
        ({ online, offline }) => {
          setOnlineUsers(online);
          setOfflineUsers(offline);
        }
      );
    }

    // Subscribe to typing indicators
    if (currentUser?.uid) {
      typingUnsubRef.current = subscribeToTyping(
        activeRoom.id,
        currentUser.uid,
        setTypers
      );
    }

    return () => {
      if (msgUnsubRef.current)      msgUnsubRef.current();
      if (typingUnsubRef.current)   typingUnsubRef.current();
      if (presenceUnsubRef.current) presenceUnsubRef.current();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoom?.id]);

  // ── Room selection ────────────────────────────────────────────────────────
  const handleSelectRoom = useCallback(async (room) => {
    // For DM rooms, ensure the conversation exists
    if (room.isDM && room.otherUserId && currentUser?.uid) {
      try {
        const dmId = await initDMConversation(currentUser.uid, room.otherUserId);
        setActiveRoom({ ...room, id: dmId });
      } catch {
        setActiveRoom(room);
      }
    } else {
      setActiveRoom(room);
    }
    setShowRoomList(false);
  }, [currentUser?.uid]);

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSendMessage = useCallback(async (text) => {
    if (!activeRoom || !currentUser) return;

    await sendMessage(
      activeRoom.id,
      currentUser.uid,
      userProfile?.displayName || currentUser.displayName || 'Anonymous',
      userProfile?.photoURL || currentUser.photoURL || '',
      text
    );
  }, [activeRoom, currentUser, userProfile]);

  // ── Typing indicator ──────────────────────────────────────────────────────
  const handleTyping = useCallback(() => {
    if (!currentUser?.uid || !activeRoom?.id) return;
    setTypingStatus(currentUser.uid, activeRoom.id, true).catch(console.error);

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setTypingStatus(currentUser.uid, activeRoom.id, false).catch(console.error);
    }, 3000);
  }, [currentUser?.uid, activeRoom?.id]);

  // ── Delete message ────────────────────────────────────────────────────────
  const handleDeleteMessage = useCallback(async (messageId) => {
    if (!activeRoom?.id) return;
    try {
      await deleteMessage(activeRoom.id, messageId);
    } catch {
      showToast('Failed to delete message.');
    }
  }, [activeRoom?.id, showToast]);

  // ── Start DM from online users list ──────────────────────────────────────
  const handleStartDM = useCallback((user) => {
    handleSelectRoom({
      id: `dm_${user.id}`,
      type: 'dm',
      name: user.name,
      isDM: true,
      otherUserId: user.id,
    });
    setShowUsersList(false);
  }, [handleSelectRoom]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="flex bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden relative"
      style={{ height: 'calc(100vh - 10rem)' }}
    >
      {/* ── LEFT: Room list (desktop always visible, mobile = drawer) ────── */}
      <div
        className={`
          absolute md:static top-0 left-0 h-full z-30
          w-72 md:w-[26%] min-w-[240px] max-w-xs
          transform transition-transform duration-300 md:translate-x-0
          ${showRoomList ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
        `}
      >
        <ChatRoomList
          userProfile={userProfile}
          activeRoomId={activeRoom?.id}
          onSelectRoom={handleSelectRoom}
          onClose={() => setShowRoomList(false)}
        />
      </div>

      {/* Mobile backdrop for room list */}
      {showRoomList && (
        <div
          className="md:hidden absolute inset-0 bg-black/40 z-20"
          onClick={() => setShowRoomList(false)}
        />
      )}

      {/* ── CENTER: Chat window ───────────────────────────────────────────── */}
      <div className="flex-1 h-full min-w-0">
        <ChatWindow
          activeRoom={activeRoom}
          messages={messages}
          currentUser={currentUser}
          typers={typers}
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          onDeleteMessage={handleDeleteMessage}
          onOpenSidebar={() => setShowRoomList(true)}
          onOpenUsers={() => setShowUsersList(true)}
        />
      </div>

      {/* ── RIGHT: Online users (desktop always visible, mobile = drawer) ── */}
      {activeRoom && !activeRoom.isDM && (
        <div
          className={`
            absolute md:static top-0 right-0 h-full z-30
            w-64 md:w-[24%] min-w-[220px] max-w-xs
            transform transition-transform duration-300 md:translate-x-0
            ${showUsersList ? 'translate-x-0 shadow-2xl' : 'translate-x-full md:translate-x-0'}
          `}
        >
          <OnlineUsersList
            onlineUsers={onlineUsers}
            offlineUsers={offlineUsers}
            onStartDM={handleStartDM}
            onClose={() => setShowUsersList(false)}
          />
        </div>
      )}

      {/* Mobile backdrop for users list */}
      {showUsersList && (
        <div
          className="md:hidden absolute inset-0 bg-black/40 z-20"
          onClick={() => setShowUsersList(false)}
        />
      )}

      {/* ── Toast notification ────────────────────────────────────────────── */}
      {toast && (
        <div
          className={`absolute top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl text-sm font-medium flex items-center gap-2
            ${toast.type === 'error'
              ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400'
              : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-400'
            }`}
        >
          <span>{toast.type === 'error' ? '⚠️' : '✅'}</span>
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default PeerChat;
