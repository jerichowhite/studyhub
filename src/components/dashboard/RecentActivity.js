import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { Upload, Download, Calendar, Sparkles, MessageSquare, Award, Star, Inbox } from 'lucide-react';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';

const ACTION_CONFIG = {
  material_upload:     { Icon: Upload,       colorClass: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',     label: 'Uploaded a material'         },
  material_downloaded: { Icon: Download,     colorClass: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400', label: 'Material downloaded by peer' },
  daily_login:         { Icon: Calendar,     colorClass: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400', label: 'Daily login bonus'           },
  ai_conversation:     { Icon: Sparkles,     colorClass: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400', label: 'AI conversation completed'   },
  chat_message:        { Icon: MessageSquare, colorClass: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',   label: 'Sent a chat message'         },
  badge_unlocked:      { Icon: Award,        colorClass: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',     label: 'Badge unlocked'              },
};
const DEFAULT_CONFIG = { Icon: Star, colorClass: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400' };

const getRelativeTime = (date) => {
  const diff    = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours   = Math.floor(diff / 3600000);
  const days    = Math.floor(diff / 86400000);
  if (minutes < 1)  return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours   < 24) return `${hours}h ago`;
  if (days    === 1) return 'Yesterday';
  return `${days}d ago`;
};

const RecentActivity = () => {
  const { currentUser } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) { setLoading(false); return; }

    const fetchActivity = async () => {
      try {
        const q = query(
          collection(db, 'pointsHistory', currentUser.uid, 'activities'),
          orderBy('timestamp', 'desc'),
          limit(10)
        );
        const snap = await getDocs(q);
        setActivities(
          snap.docs.map((d) => ({
            id:        d.id,
            action:    d.data().action || 'activity',
            points:    d.data().points || 0,
            label:     d.data().label  || d.data().action || 'Activity',
            timestamp: d.data().timestamp?.toDate?.() || new Date(),
          }))
        );
      } catch (err) {
        console.warn('RecentActivity fetch (non-fatal):', err.message);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [currentUser?.uid]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-full flex flex-col">
      <div className="p-5 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">Recent Activity</h2>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <LoadingSpinner message="Loading activity…" />
        ) : activities.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No activity yet"
            message="Earn points by uploading materials, chatting with peers, and using the AI assistant!"
          />
        ) : (
          <div className="p-2 space-y-1">
            {activities.map((item) => {
              const { Icon, colorClass } = ACTION_CONFIG[item.action] || DEFAULT_CONFIG;
              return (
                <div key={item.id} className="flex items-center gap-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors group">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {item.label || ACTION_CONFIG[item.action]?.label}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{getRelativeTime(item.timestamp)}</p>
                  </div>
                  {item.points > 0 && (
                    <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full shrink-0">
                      +{item.points}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActivity;
