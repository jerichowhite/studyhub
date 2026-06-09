import React, { useState } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

const WelcomeScreen = ({ onSaveName, onSkip }) => {
  const [aiName, setAiName] = useState('');
  const [error, setError] = useState('');

  const suggestions = ["Sage", "Nova", "Einstein", "Study Buddy"];

  const handleInputChange = (e) => {
    const val = e.target.value;
    if (val.length <= 15) {
      setAiName(val);
      setError('');
    }
  };

  const handleSave = () => {
    // Basic validation
    const trimmed = aiName.trim();
    if (!trimmed) {
      setError("Please enter a name.");
      return;
    }
    if (/^[0-9]+$/.test(trimmed)) {
      setError("Name cannot be only numbers.");
      return;
    }
    if (/^[^a-zA-Z0-9]+$/.test(trimmed)) {
      setError("Name cannot be only special characters.");
      return;
    }

    onSaveName(trimmed);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-700 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600">
      
      {/* Decorative Blur Orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500 opacity-20 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-300 opacity-20 blur-[80px] rounded-full pointer-events-none"></div>

      <div className="relative w-full max-w-lg bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl rounded-3xl p-8 sm:p-10 flex flex-col items-center text-center transition-all duration-300">
        
        <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-white rounded-full flex items-center justify-center shadow-lg mb-6 animate-bounce shadow-blue-500/30">
          <Sparkles className="w-12 h-12 text-blue-600" />
        </div>

        <h1 className="text-3xl font-black text-white mb-3">
          Hi! 👋 I'm your personal study assistant.
        </h1>
        <p className="text-blue-100 mb-8 max-w-sm mx-auto leading-relaxed">
          I'm here to help you succeed at Benson Idahosa University! Before we start, let's make this personal.
        </p>

        <div className="bg-white rounded-2xl w-full p-6 shadow-xl relative">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            What would you like to call me?
          </label>
          
          <input 
            type="text" 
            value={aiName}
            onChange={handleInputChange}
            placeholder="e.g. Sage, Nova..."
            className="w-full bg-gray-50 border-2 border-gray-200 focus:bg-white focus:border-blue-500 outline-none rounded-xl px-4 py-3 text-lg font-bold text-gray-800 transition-all text-center mb-1 placeholder:font-normal placeholder:text-gray-400"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
            }}
          />
          
          <div className="flex justify-between items-center px-1 mb-4">
            <span className="text-xs text-red-500 font-semibold">{error}</span>
            <span className="text-[10px] uppercase font-bold text-gray-400 ml-auto">
               {aiName.length} / 15 chars
            </span>
          </div>

          {/* Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setAiName(suggestion)}
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full transition-colors border border-blue-100 uppercase tracking-wide"
              >
                {suggestion}
              </button>
            ))}
          </div>

          <button 
            onClick={handleSave}
            disabled={!aiName.trim() || error.length > 0}
            className={`w-full py-4 rounded-xl font-black text-lg transition-all duration-300 shadow-md flex items-center justify-center gap-2 
              ${!aiName.trim() || error.length > 0 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
                : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-blue-500/30'
              }`}
          >
            Let's Get Started! <ArrowRight className="w-5 h-5 inline-block ml-1" />
          </button>
        </div>

        <button 
          onClick={onSkip}
          className="mt-6 text-sm text-blue-200 hover:text-white font-medium underline underline-offset-2 transition-colors cursor-pointer"
        >
          Skip for now, I'll name you later
        </button>

      </div>
    </div>
  );
};

export default WelcomeScreen;
