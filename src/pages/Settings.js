import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';

const Toast = ({ message, type }) => {
  if (!message) return null;
  const isError = type === 'error';
  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-xl animate-in fade-in flex items-center gap-2 ${isError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
      <span className="font-bold">{isError ? 'Error: ' : 'Success: '}</span> {message}
    </div>
  );
};

const Toggle = ({ label, description, checked, onChange, disabled }) => (
  <div className={`flex items-start justify-between py-3 ${disabled ? 'opacity-60' : ''}`}>
    <div className="pr-4">
      <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{label}</h4>
      {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-snug">{description}</p>}
    </div>
    <div className="shrink-0 mt-1">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && onChange()}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  </div>
);

const Settings = () => {
  const { currentUser, userProfile: userData } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  
  const [formData, setFormData] = useState({
    notifications: {
      email: true,
      inApp: true
    },
    privacy: {
      showOnMap: false,
      publicStreak: true,
      allowDMs: true
    },
    aiPreferences: {
      aiName: 'Study Assistant',
      personality: 'friendly',
      responseLength: 'detailed',
      studyReminders: false
    }
  });

  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState({ message: '', type: '' });
  
  const showToast = (message, type = 'success') => {
    setToastMsg({ message, type });
    setTimeout(() => setToastMsg({ message: '', type: '' }), 3000);
  };

  useEffect(() => {
    if (userData?.preferences) {
      setFormData(prev => ({
        ...prev,
        ...userData.preferences
      }));
    } else if (userData?.aiPreferences) {
      setFormData(prev => ({
        ...prev,
        aiPreferences: {
           ...prev.aiPreferences,
           ...userData.aiPreferences
        }
      }));
    }
    
    // Some users might have aiAssistantName at root level
    if (userData?.aiAssistantName) {
      setFormData(prev => ({
        ...prev,
        aiPreferences: {
          ...prev.aiPreferences,
          aiName: userData.aiAssistantName
        }
      }));
    }

  }, [userData]);

  const handleUpdateNested = (section, key, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const handleSaveSettings = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        preferences: formData,
        // Also keep root aiAssistantName synced for existing app queries
        aiAssistantName: formData.aiPreferences.aiName,
        aiPreferences: formData.aiPreferences 
      });
      showToast('Settings saved!');
    } catch (error) {
      console.error(error);
      showToast('Failed to save settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentUser?.email) return;
    try {
      const auth = getAuth();
      await sendPasswordResetEmail(auth, currentUser.email);
      showToast('Password reset email sent. Check your inbox.');
    } catch (error) {
      showToast('Failed to send reset email', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 mb-20">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-8">Settings</h1>
      
      <Toast message={toastMsg.message} type={toastMsg.type} />

      <div className="space-y-6">
        
        {/* Account Settings */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Account Settings</h3>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
              <input 
                type="email" 
                readOnly 
                value={currentUser?.email || ''} 
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 outline-none cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">Your email cannot be changed directly.</p>
            </div>
            <div className="pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Change Password</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">Receive an email with a secure reset link.</p>
              </div>
              <button onClick={handleChangePassword} className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                Send Reset Link
              </button>
            </div>
            <Toggle 
              label="Two-factor Authentication (2FA)"
              description="Coming soon: Secure your account with an authentication app."
              checked={false}
              onChange={() => showToast('Feature coming soon!', 'error')}
              disabled={true}
            />
          </div>
        </section>

        {/* Notifications */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Notification Preferences</h3>
          </div>
          <div className="p-6 space-y-2 divide-y divide-gray-50 dark:divide-gray-700">
            <Toggle 
              label="Email Notifications" 
              description="Receive weekly summaries and important alerts."
              checked={formData.notifications.email}
              onChange={() => handleUpdateNested('notifications', 'email', !formData.notifications.email)}
            />
            <Toggle 
              label="In-App Notifications" 
              description="Receive push notifications within the app for chats and materials."
              checked={formData.notifications.inApp}
              onChange={() => handleUpdateNested('notifications', 'inApp', !formData.notifications.inApp)}
            />
          </div>
        </section>

        {/* Privacy */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Privacy & Visibility</h3>
          </div>
          <div className="p-6 space-y-2 divide-y divide-gray-50 dark:divide-gray-700">
            <Toggle 
              label="Public Study Streak" 
              description="Let others see your learning streak on the leaderboard."
              checked={formData.privacy.publicStreak}
              onChange={() => handleUpdateNested('privacy', 'publicStreak', !formData.privacy.publicStreak)}
            />
            <Toggle 
              label="Allow Direct Messages" 
              description="Allow any student to send you a DM (if unchecked, only peers in your courses can DM you)."
              checked={formData.privacy.allowDMs}
              onChange={() => handleUpdateNested('privacy', 'allowDMs', !formData.privacy.allowDMs)}
            />
            <Toggle 
              label="Show on Campus Map" 
              description="Coming soon: Allow others to see if you are actively studying on campus."
              checked={formData.privacy.showOnMap}
              onChange={() => {}}
              disabled={true}
            />
          </div>
        </section>

        {/* AI Assistant */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">AI Assistant Preferences</h3>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">My AI Name</label>
              <input 
                type="text" 
                value={formData.aiPreferences.aiName}
                onChange={(e) => handleUpdateNested('aiPreferences', 'aiName', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 outline-none"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Personality Tone</label>
                <select 
                  value={formData.aiPreferences.personality}
                  onChange={(e) => handleUpdateNested('aiPreferences', 'personality', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 outline-none"
                >
                  <option value="formal">Formal & Academic</option>
                  <option value="friendly">Friendly Peer</option>
                  <option value="motivational">Energetic & Motivational</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Response Length</label>
                <select 
                  value={formData.aiPreferences.responseLength}
                  onChange={(e) => handleUpdateNested('aiPreferences', 'responseLength', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 outline-none"
                >
                  <option value="brief">Brief & Concise</option>
                  <option value="detailed">Comprehensive Details</option>
                  <option value="step-by-step">Step-by-Step Breakdown</option>
                </select>
              </div>
            </div>
            
            <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
               <Toggle 
                label="Proactive Study Reminders" 
                description="Allow the AI to suggest study sessions based on your course activity."
                checked={formData.aiPreferences.studyReminders}
                onChange={() => handleUpdateNested('aiPreferences', 'studyReminders', !formData.aiPreferences.studyReminders)}
              />
            </div>
          </div>
        </section>

        {/* Appearance */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Appearance & Region</h3>
          </div>
          <div className="p-6 space-y-6">
            {/* Dark Mode Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Switch between light and dark theme</p>
              </div>
              <button
                onClick={toggleTheme}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${isDarkMode ? 'bg-blue-600' : 'bg-gray-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Theme Previews */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => isDarkMode && toggleTheme()}
                className={`p-3 rounded-lg border-2 text-center transition-colors ${!isDarkMode ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600'}`}
              >
                <div className="w-full h-12 bg-white rounded mb-2 border border-gray-200 flex items-center justify-center">
                  <div className="w-8 h-2 bg-gray-300 rounded" />
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">☀️ Light</p>
              </button>
              <button
                onClick={() => !isDarkMode && toggleTheme()}
                className={`p-3 rounded-lg border-2 text-center transition-colors ${isDarkMode ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600'}`}
              >
                <div className="w-full h-12 bg-gray-900 rounded mb-2 flex items-center justify-center">
                  <div className="w-8 h-2 bg-gray-600 rounded" />
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">🌙 Dark</p>
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Language</label>
              <select disabled className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-400 dark:text-gray-500 outline-none cursor-not-allowed">
                <option>English (US)</option>
              </select>
            </div>
          </div>
        </section>

        {/* Data & Privacy */}
        <section className="bg-red-50/30 dark:bg-red-900/10 rounded-2xl shadow-sm border border-red-100 dark:border-red-900/50 overflow-hidden">
          <div className="px-6 py-5 border-b border-red-100 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/20">
            <h3 className="text-lg font-bold text-red-800 dark:text-red-400">Danger Zone</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
              <div>
                <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Download My Data</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">Export your materials, stats, and chat history as JSON.</p>
              </div>
              <button onClick={() => showToast('Data export initiated. You will receive an email shortly.')} className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors shrink-0">
                Request Export
              </button>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-t border-red-100">
              <div>
                <h4 className="text-sm font-semibold text-gray-800">Clear Conversation History</h4>
                <p className="text-xs text-gray-500">Permanently delete all AI assistant logs locally.</p>
              </div>
              <button onClick={() => { if(window.confirm('Are you certain you want to purge AI logs?')) showToast('Logs cleared.') }} className="px-4 py-2 bg-white border border-red-200 text-sm font-semibold text-red-600 rounded-lg hover:bg-red-50 transition-colors shrink-0">
                Clear Logs
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-t border-red-100">
              <div>
                <h4 className="text-sm font-semibold text-gray-800">Delete Account</h4>
                <p className="text-xs text-gray-500">Permanently remove this account and all associated data.</p>
              </div>
              <button onClick={() => { if(window.confirm('Are you sure? This cannot be undone.')) showToast('Please contact support to complete account deletion.', 'error') }} className="px-4 py-2 bg-red-600 text-sm font-semibold text-white rounded-lg hover:bg-red-700 transition-colors shrink-0">
                Delete Account
              </button>
            </div>
          </div>
        </section>

      </div>

      {/* Sticky Bottom Save Actions */}
      <div className="fixed bottom-0 left-0 md:left-64 right-0 p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 z-40 flex justify-end px-4 sm:px-8">
        <button 
          onClick={handleSaveSettings}
          disabled={loading}
          className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2.5 px-8 rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 active:translate-y-0 min-w-[150px] flex justify-center items-center"
        >
          {loading ? <span className="animate-pulse">Saving...</span> : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default Settings;
