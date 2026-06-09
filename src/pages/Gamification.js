import { useState, useEffect } from 'react';
import {
  getDoc, getDocs, doc,
  collection, query, orderBy, limit, where,
} from 'firebase/firestore';
import {
  Trophy, Flame, Upload, Download, Calendar,
  Sparkles, MessageSquare, Award, Star,
} from 'lucide-react';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

import UserProgress from '../components/gamification/UserProgress';
import BadgeDisplay  from '../components/gamification/BadgeDisplay';
import PointsHistory from '../components/gamification/PointsHistory';
import Leaderboard   from '../components/gamification/Leaderboard';
import LoadingSpinner from '../components/common/LoadingSpinner';

// ── Badge definitions ─────────────────────────────────────────────────────────
// Each badge declares the stat field + threshold needed to earn it.
// Progress is computed from live user stats so everything auto-updates.

const BADGE_DEFINITIONS = [
  { id: 'first_steps',        name: 'First Steps',        description: 'Created your account',                icon: '👞', rarity: 'Common',    requirement: 'Sign up for StudyHub',              stat: null,             threshold: 0  },
  { id: 'profile_complete',   name: 'Profile Complete',   description: 'Filled out your profile',             icon: '👤', rarity: 'Common',    requirement: 'Fill out all profile fields',       stat: 'profileComplete', threshold: 1  },
  { id: 'helper',             name: 'Helper',             description: 'Shared knowledge with peers',         icon: '🤝', rarity: 'Common',    requirement: 'Upload 5 study materials',          stat: 'materialsUploaded', threshold: 5  },
  { id: 'knowledge_sharer',   name: 'Knowledge Sharer',   description: 'True contributor to the community',   icon: '📚', rarity: 'Rare',      requirement: 'Upload 20 study materials',         stat: 'materialsUploaded', threshold: 20 },
  { id: 'community_builder',  name: 'Community Builder',  description: 'Active in peer discussions',          icon: '👥', rarity: 'Rare',      requirement: 'Send 100 chat messages',            stat: 'messagesSent',    threshold: 100 },
  { id: 'ai_explorer',        name: 'AI Explorer',        description: 'Started your AI learning journey',    icon: '✨', rarity: 'Common',    requirement: 'Complete 1 AI conversation',        stat: 'aiConversations', threshold: 1  },
  { id: 'curious_mind',       name: 'Curious Mind',       description: 'Frequent AI learner',                 icon: '🧠', rarity: 'Common',    requirement: 'Have 10 AI conversations',          stat: 'aiConversations', threshold: 10 },
  { id: 'study_partner',      name: 'Study Partner',      description: 'AI is your study buddy',              icon: '🤖', rarity: 'Rare',      requirement: 'Have 50 AI conversations',          stat: 'aiConversations', threshold: 50 },
  { id: 'consistent',         name: 'Consistent',         description: 'Building good habits',                icon: '🔥', rarity: 'Common',    requirement: '7-day login streak',                stat: 'loginStreak',     threshold: 7  },
  { id: 'dedicated',          name: 'Dedicated',          description: 'Commitment to learning',              icon: '🎇', rarity: 'Rare',      requirement: '30-day login streak',               stat: 'loginStreak',     threshold: 30 },
  { id: 'unstoppable',        name: 'Unstoppable',        description: 'Legendary dedication',                icon: '🚀', rarity: 'Epic',      requirement: '90-day login streak',               stat: 'loginStreak',     threshold: 90 },
  { id: 'early_bird',         name: 'Early Bird',         description: 'Morning study warrior',               icon: '🌅', rarity: 'Rare',      requirement: 'Login before 7am — 5 times',        stat: 'earlyLogins',     threshold: 5  },
  { id: 'night_owl',          name: 'Night Owl',          description: 'Late-night learner',                  icon: '🦉', rarity: 'Rare',      requirement: 'Login after 10pm — 10 times',       stat: 'lateLogins',      threshold: 10 },
];

const buildBadges = (userData) => {
  const stats = userData?.stats || {};
  const isProfileComplete = !!(userData?.displayName && userData?.department && userData?.university);

  const statValue = (key) => {
    if (key === null)             return 1;           // "first_steps" — always earned
    if (key === 'profileComplete') return isProfileComplete ? 1 : 0;
    return stats[key] || 0;
  };

  return BADGE_DEFINITIONS.map((def) => {
    const current = statValue(def.stat);
    const earned  = current >= def.threshold;
    return {
      ...def,
      earned,
      earnedDate: earned ? 'Earned' : null,
      progress: !earned && def.threshold > 1
        ? { current, total: def.threshold }
        : null,
    };
  });
};

// ── Points Breakdown (real stats) ─────────────────────────────────────────────

const PointsBreakdown = ({ userData }) => {
  const stats    = userData?.stats || {};
  const points   = userData?.points || 0;
  const streak   = stats.loginStreak    || 0;
  const uploads  = stats.materialsUploaded || 0;
  const aiChats  = stats.aiConversations   || 0;

  const items = [
    { label: 'Total Points',       value: points,       Icon: Trophy,    iconCls: 'text-yellow-500 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/30'  },
    { label: 'Login Streak',       value: `${streak}d`, Icon: Flame,     iconCls: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/30' },
    { label: 'Materials Uploaded', value: uploads,      Icon: Upload,    iconCls: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-50 dark:bg-blue-900/30'    },
    { label: 'AI Conversations',   value: aiChats,      Icon: Sparkles,  iconCls: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/30' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 uppercase tracking-wide">
      {items.map((item) => (
        <div
          key={item.label}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.bg}`}>
            <item.Icon className={`w-6 h-6 ${item.iconCls}`} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 leading-none mb-1">{item.label}</p>
            <p className={`text-2xl font-black ${item.iconCls}`}>{item.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Gamification page ─────────────────────────────────────────────────────────

const Gamification = () => {
  const { currentUser, userProfile: contextUserData } = useAuth();

  const [userData,       setUserData]       = useState(contextUserData || null);
  const [badges,         setBadges]         = useState([]);
  const [pointsHistory,  setPointsHistory]  = useState([]);
  const [leaderboard,    setLeaderboard]    = useState([]);
  const [userRank,       setUserRank]       = useState(null);
  const [loading,        setLoading]        = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!currentUser?.uid) return;
      setLoading(true);

      try {
        // ── 1. User profile ────────────────────────────────────────────────
        let uData = contextUserData;
        if (!uData) {
          const snap = await getDoc(doc(db, 'users', currentUser.uid));
          uData = snap.exists() ? { id: snap.id, ...snap.data() } : null;
        }
        setUserData(uData);
        setBadges(buildBadges(uData));

        // ── 2. Points history (subcollection, may be empty) ────────────────
        try {
          const hSnap = await getDocs(
            query(
              collection(db, 'pointsHistory', currentUser.uid, 'activities'),
              orderBy('timestamp', 'desc'),
              limit(20)
            )
          );
          setPointsHistory(
            hSnap.docs.map((d) => ({
              id:        d.id,
              title:     d.data().label || d.data().action || 'Activity',
              points:    d.data().points || 0,
              timeStr:   _relativeTime(d.data().timestamp?.toDate?.()),
              icon:      _actionIcon(d.data().action),
              colorClass: _actionColor(d.data().action),
            }))
          );
        } catch {
          setPointsHistory([]);
        }

        // ── 3. Leaderboard (top 50 users by points) ────────────────────────
        const lSnap = await getDocs(
          query(collection(db, 'users'), orderBy('points', 'desc'), limit(50))
        );
        const ranked = lSnap.docs.map((d, i) => ({
          id:         d.id,
          rank:       i + 1,
          name:       d.data().displayName || 'Anonymous',
          points:     d.data().points || 0,
          level:      _levelNum(d.data().points || 0),
          department: d.data().department || '',
          avatar:     d.data().photoURL || null,
          trend:      0, // no per-week tracking yet
        }));
        setLeaderboard(ranked);

        // find current user's rank
        const myEntry = ranked.find((u) => u.id === currentUser.uid);
        setUserRank(myEntry?.rank || null);

      } catch (err) {
        console.error('Gamification load error:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.uid]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner message="Loading your stats…" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 font-sans">
      <div className="mb-8">
        <UserProgress userData={userData} userRank={userRank} />
      </div>

      <PointsBreakdown userData={userData} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
        <div className="lg:col-span-3">
          <BadgeDisplay badges={badges} />
        </div>
        <div className="lg:col-span-2">
          <PointsHistory history={pointsHistory} />
        </div>
      </div>

      <div className="mb-8 h-[600px] lg:h-[700px]">
        <Leaderboard
          users={leaderboard}
          currentUserId={currentUser?.uid}
          currentUserCourses={userData?.courses || []}
        />
      </div>
    </div>
  );
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const _relativeTime = (date) => {
  if (!date) return '';
  const diff  = Date.now() - date.getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  === 1) return 'Yesterday';
  return `${days} days ago`;
};

const ACTION_ICON_MAP = {
  material_upload:     { Icon: Upload,        cls: 'bg-blue-100 text-blue-600'    },
  material_downloaded: { Icon: Download,      cls: 'bg-purple-100 text-purple-600' },
  daily_login:         { Icon: Calendar,      cls: 'bg-orange-100 text-orange-600' },
  ai_conversation:     { Icon: Sparkles,      cls: 'bg-purple-100 text-purple-600' },
  chat_message:        { Icon: MessageSquare, cls: 'bg-green-100 text-green-600'   },
  badge_unlocked:      { Icon: Award,         cls: 'bg-rose-100 text-rose-600'     },
};

const _actionIcon = (action) => {
  const { Icon } = ACTION_ICON_MAP[action] || { Icon: Star };
  return <Icon className="w-5 h-5" />;
};

const _actionColor = (action) => {
  return (ACTION_ICON_MAP[action] || { cls: 'bg-gray-100 text-gray-600' }).cls;
};

const _levelNum = (points) => {
  if (points >= 6000) return 7;
  if (points >= 3001) return 6;
  if (points >= 1501) return 5;
  if (points >= 701)  return 4;
  if (points >= 301)  return 3;
  if (points >= 101)  return 2;
  return 1;
};

export default Gamification;
