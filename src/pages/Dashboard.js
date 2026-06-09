import React, { useState, useEffect } from 'react';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { checkDailyLogin } from '../services/gamificationService';

import WelcomeCard from '../components/dashboard/WelcomeCard';
import QuickStats from '../components/dashboard/QuickStats';
import RecentActivity from '../components/dashboard/RecentActivity';
import QuickActions from '../components/dashboard/QuickActions';

const Dashboard = () => {
  const { currentUser, userProfile: contextUserData } = useAuth();
  const [userData, setUserData] = useState(contextUserData || null);
  const [loading, setLoading] = useState(!contextUserData);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If contextUserData is already provided and has everything, we might not need to fetch.
    // However, as requested, fetching here to ensure real-time update or fallback.
    const fetchUserData = async () => {
      if (!currentUser?.uid) return;
      
      try {
        setLoading(true);
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUserData({ id: userDoc.id, ...userDoc.data() });
        } else {
          // fallback if document doesn't exist but auth exists
          setUserData({ 
            displayName: currentUser.displayName || 'Student', 
            points: 0,
            level: 'Freshman Helper'
          });
        }
        
        // Track daily login
        await checkDailyLogin(currentUser.uid);
        
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Unable to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (!contextUserData && currentUser) {
      fetchUserData();
    } else {
      setUserData(contextUserData);
      setLoading(false);
    }
  }, [currentUser, contextUserData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl text-center max-w-md mx-auto mt-12">
        <span className="text-3xl mb-4 block">⚠️</span>
        <h3 className="font-bold text-lg mb-2">Oops! Something went wrong</h3>
        <p className="mb-4 text-sm">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <WelcomeCard userData={userData} />
      
      <QuickStats userData={userData} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <RecentActivity />
        <QuickActions />
      </div>
    </div>
  );
};

export default Dashboard;
