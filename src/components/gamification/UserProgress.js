import React, { useEffect, useState } from 'react';
import { Award, TrendingUp } from 'lucide-react';
import { calculateProgress, calculateLevel } from '../../services/gamificationService';

const UserProgress = ({ userData, userRank }) => {
  const points = userData?.points || 0;
  const currentLevel = calculateLevel(points);
  const { progress, pointsToNext, nextLevel } = calculateProgress(points);
  
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    // Fill animation on load
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 300);
    return () => clearTimeout(timer);
  }, [progress]);

  // SVG parameters
  const radius = 88;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedProgress / 100) * circumference;

  return (
    <div className="bg-gradient-to-br from-blue-800 via-blue-600 to-blue-500 rounded-xl shadow-lg p-6 md:p-8 text-white relative overflow-hidden flex flex-col md:flex-row items-center gap-8 md:gap-12 w-full">
      {/* Decorative Blur */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 blur-3xl rounded-full"></div>
      
      {/* Circular Progress Ring */}
      <div className="relative flex justify-center items-center w-48 h-48 sm:w-56 sm:h-56 shrink-0 z-10 transition-transform hover:scale-105 duration-300">
        <svg 
          className="w-full h-full transform -rotate-90"
          width="200" 
          height="200" 
          viewBox="0 0 200 200"
        >
          {/* Background Ring */}
          <circle 
            cx="100" cy="100" r={radius}
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth="12"
          />
          {/* Progress Ring */}
          <circle 
            cx="100" cy="100" r={radius}
            fill="transparent"
            stroke="#FFFFFF"
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Content */}
        <div className="absolute flex flex-col items-center justify-center text-center px-4 w-full h-full">
          <span className="text-sm font-semibold uppercase tracking-wider text-blue-100 mb-1">
            Level {currentLevel.num}
          </span>
          <span className="text-xl md:text-2xl font-bold leading-tight drop-shadow-md pb-1 border-b border-white/20 px-2 w-3/4 text-center">
            {currentLevel.name}
          </span>
          <span className="text-lg font-bold mt-2 text-white/90">
            {points} <span className="text-xs font-medium uppercase font-serif tracking-widest text-blue-100">pts</span>
          </span>
        </div>
      </div>

      {/* Progress Information & Ranking */}
      <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left z-10 w-full space-y-4">
        {nextLevel ? (
          <div className="w-full bg-white/10 backdrop-blur-sm p-5 border border-white/20 rounded-xl shadow-inner">
            <h3 className="text-blue-100 font-semibold mb-1 text-sm uppercase tracking-wide">Next Milestone</h3>
            <p className="text-xl md:text-2xl font-bold mb-4">
              {animatedProgress}% <span className="text-base font-normal">to {nextLevel.name}</span>
            </p>
            
            {/* Horizontal Progress Bar */}
            <div className="h-4 w-full bg-blue-900/40 rounded-full overflow-hidden shadow-inner relative mb-2">
              <div 
                className="h-full bg-gradient-to-r from-yellow-300 to-yellow-400 rounded-full transition-all duration-1000 ease-out shadow-sm"
                style={{ width: `${animatedProgress}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between text-xs font-medium text-blue-100">
              <span>{points} pts</span>
              <span>{nextLevel.min} pts ({pointsToNext} remaining)</span>
            </div>
          </div>
        ) : (
           <div className="w-full bg-white/10 backdrop-blur-sm p-6 border border-white/20 rounded-xl">
             <h3 className="text-2xl font-bold text-yellow-300">Max Level Reached!</h3>
             <p className="text-blue-100 font-medium">You are a grandmaster of StudyHub.</p>
           </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full mt-2">
          <div className="flex-1 bg-black/10 rounded-lg p-3 border border-white/10 flex items-center gap-3 transition-colors hover:bg-black/20">
             <Award className="w-7 h-7 text-yellow-300 shrink-0" />
             <div className="flex flex-col">
               <span className="text-xs text-blue-200">Current Rank</span>
               <span className="font-semibold px-2 leading-tight">
                 {userRank ? `#${userRank} in ${userData?.department || 'your department'}` : 'Unranked — earn points!'}
               </span>
             </div>
          </div>

          <div className="flex-1 bg-black/10 rounded-lg p-3 border border-white/10 flex items-center gap-3 transition-colors hover:bg-black/20">
             <TrendingUp className="w-7 h-7 text-green-300 shrink-0" />
             <div className="flex flex-col">
               <span className="text-xs text-blue-200">Total All-Time</span>
               <span className="font-semibold leading-tight">{points} points earned</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProgress;
