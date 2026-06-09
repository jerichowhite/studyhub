import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import moment from 'moment';
import {
  Bell, BookOpen, Trophy, Award, MessageSquare, MapPin,
  FileText, BarChart2, Pencil, X,
} from 'lucide-react';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { markAsRead, markAllAsRead } from '../../services/notificationService';

const getNotifIcon = (type) => {
  const map = {
    CLASS_REMINDER:     Bell,
    STUDY_SESSION:      BookOpen,
    USER_ONLINE:        MapPin,
    NEW_MATERIAL:       FileText,
    POINTS_EARNED:      Trophy,
    BADGE_UNLOCKED:     Award,
    LEADERBOARD_CHANGE: BarChart2,
    NEW_MESSAGE:        MessageSquare,
    EXAM_REMINDER:      Pencil,
  };
  const Icon = map[type] || Bell;
  return <Icon className="w-5 h-5" />;
};

const NotificationPanel = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const navigate        = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    if (!currentUser?.uid || !isOpen) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(25)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setNotifications(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
            createdAt: d.data().createdAt?.toDate?.() || new Date(),
          }))
        );
        setLoading(false);
      },
      (err) => {
        console.error('Notification listener error:', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [currentUser?.uid, isOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleClick = async (notification) => {
    if (!notification.read) await markAsRead(notification.id);

    const routes = {
      CLASS_REMINDER:     '/study-area',
      STUDY_SESSION:      '/study-area',
      EXAM_REMINDER:      '/study-area',
      NEW_MATERIAL:       '/materials',
      POINTS_EARNED:      '/gamification',
      BADGE_UNLOCKED:     '/gamification',
      LEADERBOARD_CHANGE: '/gamification',
      NEW_MESSAGE:        '/peer-chat',
      USER_ONLINE:        '/campus-map',
    };

    const route = routes[notification.type];
    if (route) navigate(route);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div className="absolute top-14 right-0 w-96 max-w-[calc(100vw-1rem)] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50 max-h-[580px] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="font-bold text-base text-gray-900 dark:text-white">Notifications</h3>
            {unreadCount > 0 && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{unreadCount} unread</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead(currentUser.uid)}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-10 flex justify-center">
              <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-10 text-center text-gray-400 flex flex-col items-center">
              <Bell className="w-12 h-12 mb-3 text-gray-200 dark:text-gray-700" />
              <p className="text-sm font-medium">No notifications yet</p>
              <p className="text-xs mt-1 text-gray-300 dark:text-gray-600">They'll show up here as you use StudyHub</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-700">
              {notifications.map((n) => {
                const config = NOTIFICATION_TYPES[n.type] || {};
                return (
                  <div
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`px-5 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                      !n.read ? 'bg-blue-50/60 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex gap-3 items-start">
                      <span className="flex-shrink-0 mt-0.5 text-gray-500 dark:text-gray-400">{getNotifIcon(n.type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-semibold leading-snug ${
                            !n.read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {n.title}
                          </p>
                          {!n.read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">{n.message}</p>
                        <p className="text-[11px] text-gray-300 dark:text-gray-600 mt-1.5">
                          {moment(n.createdAt).fromNow()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationPanel;
