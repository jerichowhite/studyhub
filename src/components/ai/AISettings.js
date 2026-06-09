import React, { useState } from 'react';

const AISettings = ({ onClose, aiName, preferences, onSave }) => {
  const [name, setName] = useState(aiName || '');
  const [personality, setPersonality] = useState(preferences?.personality || 'friendly');
  const [responseLength, setResponseLength] = useState(preferences?.responseLength || 'detailed');
  
  const [studyReminders] = useState(preferences?.features?.studyReminders || false);
  const [followUp, setFollowUp] = useState(preferences?.features?.followUpQuestions ?? true);
  const [showSources] = useState(preferences?.features?.showSources || false);

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      aiAssistantName: name,
      aiPreferences: {
        personality,
        responseLength,
        features: {
          studyReminders,
          followUpQuestions: followUp,
          showSources
        }
      }
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span className="text-2xl">⚙️</span> Settings
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh] flex flex-col gap-6">
          
          {/* Section 1: Name */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Assistant Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 15))}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white font-medium transition-colors"
            />
          </div>

          {/* Section 2: Personality */}
          <div className="space-y-3">
            <div>
              <label className="text-sm font-bold text-gray-700 block">Response Style</label>
              <p className="text-xs text-gray-500">Choose how {name} responds to you</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {['Formal', 'Friendly', 'Motivational'].map(style => {
                const val = style.toLowerCase();
                return (
                  <button
                    key={style}
                    onClick={() => setPersonality(val)}
                    className={`py-2 px-3 text-sm font-semibold rounded-lg border text-center transition-colors ${
                      personality === val 
                        ? 'bg-blue-50 border-blue-500 text-blue-700' 
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    {style}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Section 3: Length */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-700 block">Response Detail</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {['Brief', 'Detailed', 'Step-by-step'].map(style => {
                const val = style.toLowerCase();
                return (
                  <button
                    key={style}
                    onClick={() => setResponseLength(val)}
                    className={`py-2 px-3 text-[13px] font-semibold rounded-lg border text-center transition-colors ${
                      responseLength === val 
                        ? 'bg-blue-50 border-blue-500 text-blue-700' 
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    {style}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Section 4: Features */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <label className="text-sm font-bold text-gray-700 block">Extra Features</label>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">Follow-up Questions</p>
                <p className="text-xs text-gray-400">AI asks if you understood</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={followUp} onChange={() => setFollowUp(!followUp)} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between opacity-60">
              <div>
                <p className="text-sm font-medium text-gray-800">Study Reminders <span className="text-[9px] uppercase bg-gray-200 px-1 rounded ml-1">Soon</span></p>
              </div>
              <label className="relative inline-flex items-center cursor-not-allowed">
                <input type="checkbox" className="sr-only peer" disabled checked={false} />
                <div className="w-11 h-6 bg-gray-200 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5"></div>
              </label>
            </div>
          </div>

          {/* Section 5: Data */}
          <div className="pt-2 border-t border-gray-100">
            <button className="text-sm text-red-500 font-bold hover:underline">Clear All History</button>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AISettings;
