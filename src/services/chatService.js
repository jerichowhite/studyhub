import {
  ref,
  push,
  set,
  onValue,
  off,
  serverTimestamp,
  update,
  get,
  onDisconnect,
} from 'firebase/database';
import { realtimeDb } from '../firebase';

// ─── Room ID helpers ──────────────────────────────────────────────────────────

/**
 * Build a deterministic room ID from user profile fields.
 * e.g. "biu_cs_400_csc411"
 */
export const buildRoomId = (university, department, level, courseCode) => {
  const uni = (university || 'uni').toLowerCase().replace(/\s+/g, '').substring(0, 6);
  const dept = (department || 'dept').toLowerCase().replace(/\s+/g, '').substring(0, 4);
  const lvl = String(level || '100').replace(/\s+/g, '');
  const code = (courseCode || 'room').toLowerCase().replace(/[\s-]+/g, '');
  return `${uni}_${dept}_${lvl}_${code}`;
};

/**
 * DM conversation ID — always sort so A↔B and B↔A produce the same key.
 */
export const getDMId = (userId1, userId2) => {
  return [userId1, userId2].sort().join('_');
};

// ─── Rooms ────────────────────────────────────────────────────────────────────

/**
 * Ensure a course chat room exists and add the user as a member.
 */
export const joinRoom = async (userId, roomId, roomMeta = {}) => {
  const roomRef = ref(realtimeDb, `chatRooms/${roomId}`);
  const snap = await get(roomRef);

  if (!snap.exists()) {
    await set(roomRef, {
      roomName: roomMeta.roomName || roomId,
      courseCode: roomMeta.courseCode || '',
      department: roomMeta.department || '',
      level: roomMeta.level || '',
      university: roomMeta.university || '',
      createdAt: serverTimestamp(),
    });
  }

  await set(ref(realtimeDb, `chatRooms/${roomId}/members/${userId}`), true);
};

// ─── Messages ────────────────────────────────────────────────────────────────

/**
 * Send a message to a room or DM conversation.
 * Returns the new message key.
 */
export const sendMessage = async (roomId, userId, userName, userAvatar, messageText) => {
  const messagesRef = ref(realtimeDb, `messages/${roomId}`);
  const newMsgRef = push(messagesRef);

  await set(newMsgRef, {
    senderId: userId,
    senderName: userName,
    senderAvatar: userAvatar || '',
    text: messageText,
    timestamp: serverTimestamp(),
    type: 'text',
    deleted: false,
  });

  // Update room metadata with last message preview
  const isDM = roomId.startsWith('dm_') || roomId.includes('_'); // A DM id looks like dm_userId or userId1_userId2
  const updateRef = isDM ? ref(realtimeDb, `directMessages/${roomId}`) : ref(realtimeDb, `chatRooms/${roomId}`);
  
  await update(updateRef, {
    lastMessage: `${userName}: ${messageText.substring(0, 60)}`,
    lastMessageTime: serverTimestamp(),
  });

  return newMsgRef.key;
};

/**
 * Real-time listener for current user's direct messages.
 */
export const subscribeToUserDMs = (userId, callback) => {
  const dmsRef = ref(realtimeDb, 'directMessages');
  onValue(dmsRef, (snap) => {
    const dms = [];
    if (snap.exists()) {
      snap.forEach((childSnap) => {
        const dm = childSnap.val();
        if (dm.participants && dm.participants[userId]) {
          dms.push({ id: childSnap.key, ...dm });
        }
      });
    }
    // Sort descending by last message time (most recent first)
    dms.sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));
    callback(dms);
  });
  
  return () => off(dmsRef);
};

/**
 * Real-time listener for messages in a room.
 * Returns an unsubscribe function.
 */
export const subscribeToMessages = (roomId, callback) => {
  const messagesRef = ref(realtimeDb, `messages/${roomId}`);

  onValue(messagesRef, (snapshot) => {
    const messages = [];
    snapshot.forEach((child) => {
      messages.push({ id: child.key, ...child.val() });
    });
    // Sort ascending by timestamp (nulls first during optimistic adds)
    messages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    callback(messages);
  });

  return () => off(messagesRef);
};

/**
 * Real-time listener for a room's metadata (lastMessage, members, etc.).
 * Returns an unsubscribe function.
 */
export const subscribeToRoom = (roomId, callback) => {
  const roomRef = ref(realtimeDb, `chatRooms/${roomId}`);
  onValue(roomRef, (snap) => {
    if (snap.exists()) callback({ id: roomId, ...snap.val() });
  });
  return () => off(roomRef);
};

/**
 * Soft-delete a message (marks deleted flag, replaces text).
 */
export const deleteMessage = async (roomId, messageId) => {
  const msgRef = ref(realtimeDb, `messages/${roomId}/${messageId}`);
  await update(msgRef, {
    deleted: true,
    text: 'This message was deleted',
  });
};

// ─── User presence ────────────────────────────────────────────────────────────

/**
 * Mark the user as online and register a disconnect hook so Firebase
 * automatically flips them to offline when the connection drops.
 * Pass userProfile to store name/department/level in presence data.
 */
export const setUserOnline = async (userId, userProfile = null, currentRoom = null) => {
  const statusRef = ref(realtimeDb, `userStatus/${userId}`);

  const onlineData = {
    online:     true,
    lastSeen:   serverTimestamp(),
    name:       userProfile?.displayName || 'Anonymous',
    department: userProfile?.department  || '',
    level:      userProfile?.level       || '',
    ...(currentRoom ? { currentRoom } : {}),
  };

  const offlineData = {
    online:   false,
    lastSeen: serverTimestamp(),
    name:     userProfile?.displayName || 'Anonymous',
  };

  await set(statusRef, onlineData);
  onDisconnect(statusRef).set(offlineData);
};

/**
 * Subscribe to all users currently online in a specific room.
 * Also returns recently-seen offline users (those whose name was stored).
 * callback receives { online: [...], offline: [...] }
 */
export const subscribeToRoomPresence = (roomId, currentUserId, callback) => {
  const statusRef = ref(realtimeDb, 'userStatus');

  onValue(statusRef, (snap) => {
    const online  = [];
    const offline = [];

    snap.forEach((child) => {
      const uid  = child.key;
      const data = child.val();
      if (!data || uid === currentUserId) return;

      if (data.online && data.currentRoom === roomId) {
        online.push({
          id:         uid,
          name:       data.name       || 'Anonymous',
          department: data.department || '',
          level:      data.level      || '',
          online:     true,
        });
      } else if (!data.online && data.name) {
        offline.push({
          id:         uid,
          name:       data.name || 'Anonymous',
          department: data.department || '',
          level:      data.level || '',
          lastSeen:   _timeAgo(data.lastSeen),
          online:     false,
        });
      }
    });

    callback({ online, offline });
  });

  return () => off(statusRef);
};

const _timeAgo = (ts) => {
  if (!ts) return 'a while ago';
  const secs = Math.floor((Date.now() - ts) / 1000);
  if (secs < 60)   return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
};

/**
 * Update the room the user is currently viewing.
 */
export const setCurrentRoom = async (userId, roomId) => {
  await update(ref(realtimeDb, `userStatus/${userId}`), {
    currentRoom: roomId,
  });
};

/**
 * Real-time listener for a single user's online status.
 */
export const subscribeToUserStatus = (userId, callback) => {
  const statusRef = ref(realtimeDb, `userStatus/${userId}`);
  onValue(statusRef, (snap) => {
    callback(snap.exists() ? snap.val() : { online: false });
  });
  return () => off(statusRef);
};

// ─── Typing indicators ───────────────────────────────────────────────────────

export const setTypingStatus = async (userId, roomId, isTyping) => {
  const typingRef = ref(realtimeDb, `userStatus/${userId}/typing/${roomId}`);
  await set(typingRef, isTyping ? serverTimestamp() : null);
};

/**
 * Listen for other users typing in a room.
 * callback receives an array of { userId } objects who are currently typing.
 */
export const subscribeToTyping = (roomId, currentUserId, callback) => {
  const statusRef = ref(realtimeDb, 'userStatus');

  onValue(statusRef, (snap) => {
    const typers = [];
    snap.forEach((userSnap) => {
      const uid = userSnap.key;
      if (uid === currentUserId) return;
      const typing = userSnap.val()?.typing?.[roomId];
      if (typing) {
        // Check timestamp freshness (< 5 seconds)
        const age = Date.now() - (typeof typing === 'number' ? typing : 0);
        if (age < 5000) typers.push({ userId: uid, name: userSnap.val()?.name });
      }
    });
    callback(typers);
  });

  return () => off(statusRef);
};

// ─── Direct Messages ─────────────────────────────────────────────────────────

/**
 * Ensure a DM conversation record exists in the database.
 */
export const initDMConversation = async (userId1, userId2) => {
  const dmId = getDMId(userId1, userId2);
  const dmRef = ref(realtimeDb, `directMessages/${dmId}`);
  const snap = await get(dmRef);

  if (!snap.exists()) {
    await set(dmRef, {
      participants: { [userId1]: true, [userId2]: true },
      createdAt: serverTimestamp(),
    });
  }

  return dmId;
};
