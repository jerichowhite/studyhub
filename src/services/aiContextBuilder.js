import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  limit,
} from 'firebase/firestore';
import { db } from '../firebase';

// ── Public entry point ────────────────────────────────────────────────────────

/**
 * Fetches all relevant Firestore data for a user and returns a structured
 * context object that the AI system prompt can reference.
 *
 * All sub-fetches run in parallel and fail gracefully — if any collection
 * doesn't exist yet the relevant context key just returns an empty object.
 */
export const buildComprehensiveContext = async (userId, userData) => {
  const [gamification, schedule, materials, studyArea, activity, social] =
    await Promise.all([
      _getGamificationContext(userId, userData),
      _getScheduleContext(userId),
      _getMaterialsContext(userId),
      _getStudyAreaContext(userId),
      _getActivityContext(userId),
      _getSocialContext(userId),
    ]);

  return {
    user: {
      name:       userData?.displayName,
      email:      userData?.email,
      level:      userData?.level,
      department: userData?.department,
      university: userData?.university,
      courses:    userData?.courses || [],
    },
    gamification,
    schedule,
    materials,
    studyArea,
    activity,
    social,
    temporal: _getTemporalContext(),
  };
};

// ── Sub-fetchers ──────────────────────────────────────────────────────────────

const _getGamificationContext = async (_userId, userData) => {
  try {
    return {
      points:             userData?.points || 0,
      level:              userData?.currentLevel || 'Freshman Helper',
      rank:               userData?.rank || null,
      badges:             userData?.badges || [],
      streak:             userData?.stats?.loginStreak || 0,
      todayPoints:        userData?.stats?.todayPoints || 0,
      weekPoints:         userData?.stats?.weekPoints || 0,
      materialsUploaded:  userData?.stats?.materialsUploaded || 0,
      aiConversations:    userData?.stats?.aiConversations || 0,
      recentAchievements: userData?.recentAchievements || [],
    };
  } catch {
    return {};
  }
};

const _getScheduleContext = async (userId) => {
  try {
    // Avoid orderBy+where composite index requirement by sorting client-side
    const q = query(
      collection(db, 'scheduleEvents'),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    const now = new Date();

    const events = snapshot.docs.map((d) => d.data());

    // Sort ascending by startTime
    events.sort((a, b) => {
      const ta = a.startTime?.toDate ? a.startTime.toDate() : new Date(a.startTime || 0);
      const tb = b.startTime?.toDate ? b.startTime.toDate() : new Date(b.startTime || 0);
      return ta - tb;
    });

    const toDate = (ts) => (ts?.toDate ? ts.toDate() : ts ? new Date(ts) : null);

    const upcomingClasses = events
      .filter((e) => {
        const t = toDate(e.startTime);
        return t && t > now;
      })
      .slice(0, 5)
      .map((e) => ({
        title:    e.title,
        course:   e.courseCode,
        time:     toDate(e.startTime),
        location: e.location,
      }));

    const nextExam = events.find((e) => {
      const t = toDate(e.startTime);
      return e.type === 'exam' && t && t > now;
    });

    const todayClasses = events
      .filter((e) => {
        const t = toDate(e.startTime);
        return t && t.toDateString() === now.toDateString();
      })
      .map((e) => ({
        title:    e.title,
        time:     toDate(e.startTime),
        location: e.location,
      }));

    return { totalEvents: events.length, upcomingClasses, nextExam, todayClasses };
  } catch {
    return {};
  }
};

const _getMaterialsContext = async (userId) => {
  try {
    // No orderBy to avoid composite index; sort client-side
    const q = query(
      collection(db, 'materials'),
      where('uploaderId', '==', userId),
      limit(20)
    );
    const snapshot = await getDocs(q);
    let materials = snapshot.docs.map((d) => ({
      title:      d.data().title,
      course:     d.data().courseCode,
      type:       d.data().materialType,
      uploadedAt: d.data().createdAt,
    }));

    materials.sort((a, b) => {
      const ta = a.uploadedAt?.toMillis?.() ?? 0;
      const tb = b.uploadedAt?.toMillis?.() ?? 0;
      return tb - ta;
    });

    return {
      uploaded:     materials.slice(0, 10),
      totalUploaded: materials.length,
    };
  } catch {
    return {};
  }
};

const _getStudyAreaContext = async (userId) => {
  try {
    const whiteboardDoc = await getDoc(doc(db, 'whiteboards', userId));
    if (!whiteboardDoc.exists()) return { hasWhiteboard: false };

    const data = whiteboardDoc.data();
    // The canvas content is binary; look for any text-type elements stored
    // in the elements array (if present), otherwise skip
    let whiteboardSummary = '';
    if (data?.content?.elements) {
      whiteboardSummary = data.content.elements
        .filter((el) => el.type === 'text')
        .map((el) => el.text || '')
        .join(' ')
        .substring(0, 1000);
    }

    return {
      hasWhiteboard:    true,
      whiteboardSummary,
      lastUpdated:      data?.lastUpdated,
    };
  } catch {
    return {};
  }
};

const _getActivityContext = async (userId) => {
  try {
    // pointsHistory sub-collection may not exist yet; fail gracefully
    const q = query(
      collection(db, 'pointsHistory', userId, 'activities'),
      limit(10)
    );
    const snapshot = await getDocs(q);
    const recent = snapshot.docs.map((d) => ({
      action:    d.data().action,
      points:    d.data().points,
      timestamp: d.data().timestamp,
    }));

    const mostFrequentAction = _getMostFrequent(recent.map((a) => a.action));

    return { recent, mostFrequentAction };
  } catch {
    return {};
  }
};

const _getSocialContext = async (userId) => {
  try {
    const q = query(
      collection(db, 'messages'),
      where('userId', '==', userId),
      limit(1)
    );
    const snap = await getDocs(q);
    return { hasMessages: snap.size > 0 };
  } catch {
    return {};
  }
};

const _getTemporalContext = () => {
  const now  = new Date();
  const hour = now.getHours();

  let timeOfDay = 'morning';
  if (hour >= 12 && hour < 17)       timeOfDay = 'afternoon';
  else if (hour >= 17 && hour < 21)  timeOfDay = 'evening';
  else if (hour >= 21 || hour < 6)   timeOfDay = 'night';

  return {
    currentTime: now,
    timeOfDay,
    dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long' }),
    isWeekend:  now.getDay() === 0 || now.getDay() === 6,
    hour,
  };
};

// ── Insight helpers (exported so aiService can reuse) ─────────────────────────

export const getGamificationInsight = (gam = {}) => {
  if (!gam.points && gam.points !== 0) return '';
  if (gam.streak >= 7)     return `Impressive ${gam.streak}-day streak! Keep it going!`;
  if (gam.points > 1000)   return 'You\'re racking up serious points!';
  if (!gam.badges?.length) return 'Let\'s work on unlocking your first badge!';
  return 'Steady progress!';
};

export const getScheduleInsight = (schedule = {}, temporal = {}) => {
  if (schedule.nextExam?.startTime) {
    const examDate = schedule.nextExam.startTime?.toDate
      ? schedule.nextExam.startTime.toDate()
      : new Date(schedule.nextExam.startTime);
    const daysUntil = Math.ceil((examDate - new Date()) / (1000 * 60 * 60 * 24));
    if (daysUntil <= 3) return `⚠️ Exam in ${daysUntil} day(s) — PRIORITISE EXAM PREP!`;
    if (daysUntil <= 7) return `Exam coming up in ${daysUntil} days. Time to start reviewing!`;
  }
  if (schedule.todayClasses?.length > 0) return 'Busy day ahead with classes!';
  if (temporal.isWeekend) return 'Weekend — great time for deep study sessions!';
  return 'Schedule looks manageable.';
};

export const getMaterialsInsight = (materials = {}) => {
  if ((materials.totalUploaded || 0) >= 10) return 'Great contributor to the community!';
  if (!materials.totalUploaded)             return 'Consider sharing your notes to help others!';
  return 'Building up a nice collection of materials.';
};

export const getActivityInsight = (activity = {}) => {
  if (!activity.recent?.length)                        return 'Let\'s get some study momentum going!';
  if (activity.mostFrequentAction === 'upload_material') return 'You\'re really helping the community with uploads!';
  if (activity.mostFrequentAction === 'daily_login')    return 'Consistency is key — great daily habit!';
  return 'Active and engaged!';
};

export const getTemporalInsight = (temporal = {}) => {
  if (temporal.timeOfDay === 'night') return 'It\'s getting late — consider wrapping up soon!';
  if (temporal.timeOfDay === 'morning') return 'Great time for focused study!';
  if (temporal.isWeekend) return 'Weekend vibes — make the most of your study time!';
  return '';
};

export const getTimeAgo = (timestamp) => {
  if (!timestamp?.toDate && !timestamp) return 'recently';
  const date    = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60)   return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

// ── Utility ───────────────────────────────────────────────────────────────────

const _getMostFrequent = (arr) => {
  if (!arr?.length) return null;
  const freq = {};
  arr.forEach((item) => { freq[item] = (freq[item] || 0) + 1; });
  return Object.keys(freq).reduce((a, b) => (freq[a] > freq[b] ? a : b));
};
