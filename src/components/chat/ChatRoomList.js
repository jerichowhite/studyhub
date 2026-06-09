import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { subscribeToUserDMs } from '../../services/chatService';
import UserStatusIndicator from './UserStatusIndicator';
import UserSearchModal from './UserSearchModal';

const buildCourseRooms = (courses = []) =>
  courses.map((courseStr) => {
    const parts = courseStr.split(' - ');
    const code = parts[0]?.trim() || courseStr;
    const name = parts[1]?.trim() || courseStr;
    const roomId = `biu_cs_400_${code.toLowerCase().replace(/\s+/g, '')}`;
    return {
      id: roomId,
      type: 'room',
      courseCode: code,
      name: `${code} - ${name}`,
      lastMessage: 'No messages yet',
      time: '',
      unread: Math.floor(Math.random() * 4),
      onlineCount: Math.floor(Math.random() * 7) + 2,
    };
  });

const RoomItem = ({ room, isActive, onClick }) => (
  <button
    onClick={() => onClick(room)}
    className={`w-full text-left flex items-center gap-3 px-4 py-3 transition-all border-l-4 hover:bg-blue-50 dark:hover:bg-gray-700/50
      ${isActive ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-transparent'}`}
  >
    <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-black text-xs flex items-center justify-center shrink-0">
      {room.courseCode?.replace(/\s+/g, '').substring(0, 4) || '📚'}
    </div>

    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between">
        <span className={`text-sm font-semibold truncate ${isActive ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200'}`}>
          {room.name}
        </span>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {room.time && (
            <span className="text-[10px] text-gray-400 dark:text-gray-500">{room.time}</span>
          )}
          {room.unread > 0 && (
            <span className="bg-blue-600 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
              {room.unread}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between mt-0.5">
        <span className="text-xs text-gray-400 dark:text-gray-500 truncate">{room.lastMessage}</span>
        <span className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500 shrink-0 ml-2">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
          {room.onlineCount} online
        </span>
      </div>
    </div>
  </button>
);

const DMItem = ({ dm, isActive, onClick }) => (
  <button
    onClick={() => onClick(dm)}
    className={`w-full text-left flex items-center gap-3 px-4 py-3 transition-all border-l-4 hover:bg-blue-50 dark:hover:bg-gray-700/50
      ${isActive ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-transparent'}`}
  >
    <div className="relative shrink-0">
      <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold flex items-center justify-center text-sm overflow-hidden">
        {dm.avatar
          ? <img src={dm.avatar} alt={dm.name} className="w-full h-full object-cover" />
          : dm.name.charAt(0).toUpperCase()
        }
      </div>
      <UserStatusIndicator
        online={dm.online}
        size="sm"
        className="absolute -bottom-0.5 -right-0.5"
      />
    </div>

    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between">
        <span className={`text-sm font-semibold truncate ${isActive ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200'}`}>
          {dm.name}
        </span>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {dm.time && <span className="text-[10px] text-gray-400 dark:text-gray-500">{dm.time}</span>}
          {dm.unread > 0 && (
            <span className="bg-blue-600 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
              {dm.unread}
            </span>
          )}
        </div>
      </div>
      <span className="text-xs text-gray-400 dark:text-gray-500 truncate block">{dm.lastMessage}</span>
    </div>
  </button>
);

const ChatRoomList = ({ userProfile, activeRoomId, onSelectRoom, onClose }) => {
  const { currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [showNewMsg, setShowNewMsg] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [dms, setDms] = useState([]);
  const [usersMap, setUsersMap] = useState({});

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);
        const map = {};
        snapshot.forEach((doc) => { map[doc.id] = doc.data(); });
        setUsersMap(map);
      } catch (err) {
        console.error('Error fetching users for ChatRoomList', err);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsub = subscribeToUserDMs(currentUser.uid, (fetchedDMs) => {
      const formattedDMs = fetchedDMs.map((dm) => {
        const otherUserId = Object.keys(dm.participants || {}).find(id => id !== currentUser.uid);
        const otherUser = usersMap[otherUserId] || {};
        const displayName = otherUser.displayName || otherUser.name || 'Unknown User';

        let timeStr = '';
        if (dm.lastMessageTime) {
          const date = new Date(dm.lastMessageTime);
          const isToday = new Date().toDateString() === date.toDateString();
          timeStr = isToday ? date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : date.toLocaleDateString();
        }

        return {
          id: dm.id,
          type: 'dm',
          name: displayName,
          lastMessage: dm.lastMessage || 'No messages yet',
          time: timeStr,
          online: otherUser.online || false,
          unread: 0,
          avatar: otherUser.photoURL || null,
          isDM: true,
          otherUserId,
        };
      });
      setDms(formattedDMs);
    });
    return () => unsub();
  }, [currentUser, usersMap]);

  useEffect(() => {
    const courses = userProfile?.courses || [
      'CSC 411 - Net-Centric Computing',
      'CSC 412 - Software Engineering',
      'CSC 413 - Advanced DBMS',
      'CSC 414 - System Analysis and Design',
      'CSC 415 - Artificial Intelligence',
      'CSC 417 - Human Computer Interaction',
      'CSC 419 - Operating Systems',
    ];
    setRooms(buildCourseRooms(courses));
  }, [userProfile]);

  const filteredRooms = rooms.filter(
    (r) => !search || r.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredDMs = dms.filter(
    (d) => !search || d.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectUser = (user) => {
    const displayName = user.displayName || user.name || 'User';
    const dmRoom = {
      id: `dm_${user.id}`,
      type: 'dm',
      name: displayName,
      isDM: true,
      otherUserId: user.id,
      avatar: user.photoURL || null,
    };
    onSelectRoom(dmRoom);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-gray-700 shrink-0">
        <h2 className="font-bold text-gray-800 dark:text-white">Messages</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewMsg(true)}
            className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors shadow-sm"
            title="New message"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-2 border-b border-gray-50 dark:border-gray-700 shrink-0">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rooms or users…"
            className="w-full pl-8 pr-8 py-1.5 text-xs rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Room list */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-4 pb-1">
          <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Course Chats</p>
        </div>
        {filteredRooms.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 italic px-4 py-2">No rooms found</p>
        ) : (
          filteredRooms.map((room) => (
            <RoomItem
              key={room.id}
              room={room}
              isActive={activeRoomId === room.id}
              onClick={onSelectRoom}
            />
          ))
        )}

        <div className="px-4 pt-5 pb-1">
          <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Direct Messages</p>
        </div>
        {filteredDMs.length === 0 ? (
          <div className="px-4 py-4 text-center">
            <p className="text-xs text-gray-400 dark:text-gray-500 italic">No direct messages yet</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Click + to start a conversation</p>
          </div>
        ) : (
          filteredDMs.map((dm) => (
            <DMItem
              key={dm.id}
              dm={dm}
              isActive={activeRoomId === dm.id}
              onClick={onSelectRoom}
            />
          ))
        )}

        <div className="h-4" />
      </div>

      {showNewMsg && (
        <UserSearchModal
          onClose={() => setShowNewMsg(false)}
          onSelectUser={handleSelectUser}
        />
      )}
    </div>
  );
};

export default ChatRoomList;
