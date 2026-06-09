const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const getLevelInfo = (points) => {
  const levels = [
    { name: 'Freshman Helper',    min: 0,    max: 100  },
    { name: 'Sophomore Scholar',  min: 101,  max: 300  },
    { name: 'Junior Genius',      min: 301,  max: 700  },
    { name: 'Senior Sage',        min: 701,  max: 1500 },
    { name: 'Graduate Guru',      min: 1501, max: 3000 },
    { name: 'Teaching Assistant', min: 3001, max: 6000 },
    { name: 'Professor',          min: 6000, max: Infinity },
  ];
  const currentLevel = levels.find((l) => points >= l.min && points <= l.max) || levels[0];
  const nextLevel    = levels[levels.indexOf(currentLevel) + 1];
  const progress     = nextLevel
    ? ((points - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100
    : 100;
  return { currentLevel, nextLevel, progress: Math.min(Math.max(progress, 0), 100) };
};

const WelcomeCard = ({ userData }) => {
  const points      = userData?.points || 0;
  const displayName = userData?.displayName || 'Student';
  const streak      = userData?.stats?.loginStreak || 0;
  const { currentLevel, nextLevel, progress } = getLevelInfo(points);

  const motivationalMessage = (() => {
    if (streak >= 30) return `${streak}-day streak! Absolutely legendary! 🏆`;
    if (streak >= 7)  return `${streak}-day streak! You're unstoppable! 🔥`;
    if (streak >= 3)  return `You're on a ${streak}-day streak! Keep it up! 🎯`;
    return "Ready to learn something new today? 💡";
  })();

  return (
    <div className="bg-gradient-to-br from-blue-700 to-blue-500 rounded-2xl shadow-lg p-6 md:p-8 text-white relative overflow-hidden mb-6">
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-10 blur-2xl" />
      <div className="absolute bottom-0 right-32 -mb-24 w-48 h-48 rounded-full bg-blue-300 opacity-20 blur-xl" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex-1 space-y-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">
              {getGreeting()}, {displayName}!
            </h1>
            <p className="text-blue-100 text-lg opacity-90 font-medium">
              {motivationalMessage}
            </p>
          </div>
          <div className="inline-block bg-white/20 backdrop-blur-md border border-white/30 rounded-xl px-4 py-2 mt-2 shadow-sm">
            <span className="text-sm font-semibold tracking-wide uppercase text-blue-50 relative top-[-1px]">
              Current Stage:
            </span>
            <span className="ml-2 font-bold text-lg text-white">{currentLevel.name}</span>
          </div>
        </div>

        <div className="w-full lg:w-96 bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20 shadow-inner">
          <div className="flex justify-between items-end mb-2">
            <div>
              <span className="text-3xl font-bold">{points}</span>
              <span className="text-blue-100 text-sm ml-1 uppercase tracking-wider font-semibold">pts</span>
            </div>
            {nextLevel && (
              <span className="text-xs font-medium text-blue-100 text-right">
                {Math.round(progress)}% to {nextLevel.name}
              </span>
            )}
          </div>
          <div className="h-3 w-full bg-blue-900/40 rounded-full overflow-hidden mt-3 backdrop-blur-md shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-yellow-300 to-yellow-400 rounded-full transition-all duration-1000 ease-out shadow-sm"
              style={{ width: `${progress}%` }}
            />
          </div>
          {nextLevel && (
            <p className="text-xs text-blue-200 mt-3 text-right">
              {nextLevel.min - points} points remaining
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default WelcomeCard;
