import {
  collection,
  addDoc,
  query,
  where,
  updateDoc,
  doc,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';

// ── Notification type metadata ────────────────────────────────────────────────

export const NOTIFICATION_TYPES = {
  CLASS_REMINDER:    { color: 'blue',   priority: 'high'   },
  STUDY_SESSION:     { color: 'purple', priority: 'medium' },
  USER_ONLINE:       { color: 'green',  priority: 'low'    },
  NEW_MATERIAL:      { color: 'blue',   priority: 'medium' },
  POINTS_EARNED:     { color: 'yellow', priority: 'low'    },
  BADGE_UNLOCKED:    { color: 'gold',   priority: 'high'   },
  LEADERBOARD_CHANGE:{ color: 'purple', priority: 'low'    },
  NEW_MESSAGE:       { color: 'blue',   priority: 'high'   },
  EXAM_REMINDER:     { color: 'red',    priority: 'high'   },
};

// ── Create notification ───────────────────────────────────────────────────────

export const createNotification = async (userId, notification) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      type:     notification.type,
      title:    notification.title,
      message:  notification.message,
      data:     notification.data || {},
      read:     false,
      priority: NOTIFICATION_TYPES[notification.type]?.priority || 'low',
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// ── Mark single notification read ─────────────────────────────────────────────

export const markAsRead = async (notificationId) => {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      read:   true,
      readAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};

// ── Mark all notifications read ───────────────────────────────────────────────

export const markAllAsRead = async (userId) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read',   '==', false)
    );
    const snapshot = await getDocs(q);
    await Promise.all(
      snapshot.docs.map((d) =>
        updateDoc(d.ref, { read: true, readAt: serverTimestamp() })
      )
    );
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
};

// ── Helpers called from other services ───────────────────────────────────────

export const notifyPointsEarned = (userId, points, reason) =>
  createNotification(userId, {
    type:    'POINTS_EARNED',
    title:   `+${points} Points!`,
    message: `You earned ${points} points for ${reason}`,
    data:    { points, reason },
  });

export const notifyBadgeUnlocked = (userId, badge) =>
  createNotification(userId, {
    type:    'BADGE_UNLOCKED',
    title:   '🎉 New Badge Unlocked!',
    message: `You've earned the "${badge.name}" badge!`,
    data:    { badge },
  });

export const notifyNewMaterial = (userId, material) =>
  createNotification(userId, {
    type:    'NEW_MATERIAL',
    title:   'New Study Material',
    message: `New material uploaded for ${material.courseCode}: ${material.title}`,
    data:    { materialId: material.id },
  });

export const notifyUserOnline = (userId, friendName) =>
  createNotification(userId, {
    type:    'USER_ONLINE',
    title:   'Friend Online',
    message: `${friendName} just came online`,
    data:    { friendName },
  });

// ── Class reminder checker ────────────────────────────────────────────────────
// Called on an interval; tracks already-notified events to avoid duplicates.

const _notifiedEventIds = new Set();

export const checkClassReminders = async (userId, schedule) => {
  const now = new Date();
  const fifteenMinsLater = new Date(now.getTime() + 15 * 60 * 1000);

  for (const event of schedule) {
    if (!event.startTime) continue;

    const classTime = event.startTime?.toDate
      ? event.startTime.toDate()
      : new Date(event.startTime);

    // Use base event id (strip recurring suffix) + date as key
    const notifKey = `${event.id}_${classTime.toDateString()}`;

    if (_notifiedEventIds.has(notifKey)) continue;

    if (classTime > now && classTime <= fifteenMinsLater) {
      _notifiedEventIds.add(notifKey);
      await createNotification(userId, {
        type:    'CLASS_REMINDER',
        title:   'Class Starting Soon!',
        message: `${event.title} starts in 15 minutes${event.location ? ` at ${event.location}` : ''}`,
        data:    { eventId: event.id, classTime },
      });
    }
  }
};
