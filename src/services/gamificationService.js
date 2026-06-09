// Helper calculations for points, levels, and badges
import { doc, updateDoc, increment, serverTimestamp, collection, addDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const calculateLevel = (points) => {
  const levels = [
    { num: 1, name: "Freshman Helper", min: 0, max: 100 },
    { num: 2, name: "Sophomore Scholar", min: 101, max: 300 },
    { num: 3, name: "Junior Genius", min: 301, max: 700 },
    { num: 4, name: "Senior Sage", min: 701, max: 1500 },
    { num: 5, name: "Graduate Guru", min: 1501, max: 3000 },
    { num: 6, name: "Teaching Assistant", min: 3001, max: 6000 },
    { num: 7, name: "Professor", min: 6000, max: Infinity },
  ];
  
  return levels.find(l => points >= l.min && points <= l.max) || levels[0];
};

export const calculateProgress = (points) => {
  const currentLevel = calculateLevel(points);
  const levels = [
    { num: 1, name: "Freshman Helper", min: 0, max: 100 },
    { num: 2, name: "Sophomore Scholar", min: 101, max: 300 },
    { num: 3, name: "Junior Genius", min: 301, max: 700 },
    { num: 4, name: "Senior Sage", min: 701, max: 1500 },
    { num: 5, name: "Graduate Guru", min: 1501, max: 3000 },
    { num: 6, name: "Teaching Assistant", min: 3001, max: 6000 },
    { num: 7, name: "Professor", min: 6000, max: Infinity },
  ];
  const nextLevel = levels[levels.indexOf(currentLevel) + 1];
  
  if (!nextLevel) return { progress: 100, pointsToNext: 0, nextLevel: null };
  
  const progress = ((points - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100;
  const pointsToNext = nextLevel.min - points;
  
  return { 
    progress: Math.max(0, Math.min(Math.round(progress), 100)), 
    pointsToNext,
    nextLevel 
  };
};

export const checkBadgeUnlock = (badge, userStats) => {
  // TODO: Add logic to check if requirements are met
  // e.g. if (badge.type === 'streak' && userStats.loginStreak >= badge.requiredStreak) return true;
  return false;
};

export const awardPoints = async (userId, amount, actionLabel, actionId) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    // Update total points
    await updateDoc(userRef, { 
      points: increment(amount),
      updatedAt: serverTimestamp()
    });
    
    // Insert into points history
    const historyRef = collection(db, 'pointsHistory', userId, 'activities');
    await addDoc(historyRef, {
      action: actionId || 'activity',
      label: actionLabel,
      points: amount,
      timestamp: serverTimestamp()
    });
    
    console.log(`Awarded ${amount} points to user ${userId} for ${actionId}`);
  } catch (err) {
    console.error("Error in awardPoints:", err);
  }
};

export const checkDailyLogin = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;
    
    const data = userSnap.data();
    const stats = data.stats || {};
    
    const now = new Date();
    // Use local date string to keep it simple and timezone-aware
    const todayStr = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    
    const lastLogin = stats.lastLoginDate;
    
    if (lastLogin !== todayStr) {
      let newStreak = stats.loginStreak || 0;
      
      if (lastLogin) {
        // Parse "YYYY-M-D"
        const [ly, lm, ld] = lastLogin.split("-").map(Number);
        const lastDate = new Date(ly, lm - 1, ld);
        const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        const diffMs = todayDate - lastDate;
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          newStreak += 1;
        } else if (diffDays > 1) {
          newStreak = 1; // broken streak
        }
      } else {
        newStreak = 1; // first login
      }
      
      const hour = now.getHours();
      const isEarly = hour < 7;
      const isLate = hour >= 22;
      
      const updateData = {
        'stats.lastLoginDate': todayStr,
        'stats.loginStreak': newStreak,
      };
      
      if (isEarly) updateData['stats.earlyLogins'] = increment(1);
      if (isLate) updateData['stats.lateLogins'] = increment(1);
      
      await updateDoc(userRef, updateData);
      
      await awardPoints(userId, 5, 'Daily Login', 'daily_login');
    }
  } catch (err) {
    console.error("Error tracking daily login:", err);
  }
};
