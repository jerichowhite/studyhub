import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const FAQS = [
  {
    q: "How do I upload course materials?",
    a: "Navigate to the Materials library via your dashboard, and click the 'Upload Material' button. Ensure files are under 2MB."
  },
  {
    q: "How does the AI assistant work?",
    a: "Our AI taps into GPT-4o capabilities. Setup your AI preferences in Settings, matching its personality perfectly to your taste, then start chatting in the AI Studio."
  },
  {
    q: "How do I earn points and badges?",
    a: "Uploading notes earns you 10 points. Every time someone downloads your notes, you receive 2 points! Engage in chats and track your level on the gamification leaderboard."
  },
  {
    q: "How do I change my profile information?",
    a: "Click your avatar in the top right menu, go to 'My Profile', and edit any fields like Department or Level. Be sure to hit 'Save Changes'."
  },
  {
    q: "How do I reset my password?",
    a: "You can trigger a password reset email directly inside your Settings panel or from the login screen if you forget it."
  },
  {
    q: "How do I delete my account?",
    a: "Currently, full account deletion requires navigating to Settings > Danger Zone, where you will be prompted to contact support to initiate purges."
  },
  {
    q: "How do I report inappropriate content?",
    a: "If you detect any guideline violations, contact support using the form below with screenshots and context."
  },
  {
    q: "Why can't I see some features?",
    a: "We are continually building features! Some features shown on the dashboard marked as 'Coming Soon' are placeholders for our upcoming Beta 2.0 release."
  }
];

const AccordionItem = ({ q, a }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-gray-100 dark:border-gray-700 rounded-xl mb-3 overflow-hidden bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-4 text-left font-semibold text-gray-800 dark:text-gray-200 focus:outline-none"
      >
        <span>{q}</span>
        <svg className={`w-5 h-5 text-gray-400 dark:text-gray-500 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </button>
      {isOpen && (
        <div className="px-4 pb-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed border-t border-gray-50 dark:border-gray-700 pt-3 bg-gray-50/50 dark:bg-gray-700/30">
          {a}
        </div>
      )}
    </div>
  );
};

const HelpSupport = () => {
  const { currentUser, userProfile: userData } = useAuth();
  
  const [formState, setFormState] = useState({
    subject: 'Bug Report',
    message: ''
  });
  
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleSupportSubmit = (e) => {
    e.preventDefault();
    setSubmitStatus('sending');
    // Simulate delay
    setTimeout(() => {
      setSubmitStatus('success');
      setFormState(prev => ({ ...prev, message: ''}));
      setTimeout(() => setSubmitStatus(null), 3000);
    }, 1500);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 mb-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Help & Support</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Get assistance, submit feedback, or browse our frequently asked questions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: FAQs & Links */}
        <div className="lg:col-span-2 space-y-8">
          
          <section>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <span>Frequently Asked Questions</span>
            </h2>
            <div className="space-y-1">
              {FAQS.map((faq, i) => <AccordionItem key={i} q={faq.q} a={faq.a} />)}
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 hover:border-blue-200 dark:hover:border-blue-600 transition-colors cursor-pointer block group">
               <h3 className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2">Tutorial Videos</h3>
               <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Watch our getting started series to master StudyHub&apos;s features.</p>
               <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-[10px] font-bold uppercase rounded-md tracking-widest">Coming Soon</span>
            </div>
            <a href="#" className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 hover:border-blue-200 dark:hover:border-blue-600 transition-colors cursor-pointer block group">
               <h3 className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2">User Guide & Rules</h3>
               <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Read comprehensive platform guidelines and peer-to-peer rules.</p>
               <span className="inline-flex items-center text-xs font-bold text-blue-600">
                 Read Docs <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
               </span>
            </a>
          </section>
        </div>

        {/* Right Column: Contact, Status, About */}
        <div className="space-y-6">
          
          {/* Contact Form */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-blue-50/50 dark:bg-blue-900/20 flex items-center gap-2">
              <span className="p-1.5 bg-blue-100 text-blue-600 rounded-lg shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              </span>
              <div>
                <h3 className="font-bold text-gray-800 dark:text-white leading-tight">Contact Support</h3>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Response within 24 - 48 hours</p>
              </div>
            </div>
            
            <form onSubmit={handleSupportSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">From</label>
                <input 
                  type="text" 
                  value={`${userData?.displayName || 'User'} (${currentUser?.email || ''})`}
                  disabled
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Subject / Category</label>
                <select 
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  value={formState.subject}
                  onChange={(e) => setFormState(prev => ({...prev, subject: e.target.value}))}
                >
                  <option>Bug Report</option>
                  <option>Feature Request</option>
                  <option>Account Issue</option>
                  <option>Report Content</option>
                  <option>General Question</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
                <textarea 
                  required
                  rows="4"
                  placeholder="Describe your issue or feedback in detail..."
                  value={formState.message}
                  onChange={(e) => setFormState(prev => ({...prev, message: e.target.value}))}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Attach Screenshot (Optional)</label>
                <input type="file" className="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              </div>

              <button 
                type="submit" 
                disabled={submitStatus === 'sending'}
                className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm transition-colors flex justify-center items-center h-10"
              >
                {submitStatus === 'sending' ? (
                  <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div> Sending...</span>
                ) : submitStatus === 'success' ? (
                  <span className="text-green-300">Message Sent ✓</span>
                ) : (
                  'Send Message to Support'
                )}
              </button>
            </form>
          </section>

          {/* System Status */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-50 dark:border-gray-700">
              <h3 className="font-bold text-gray-800 dark:text-white text-sm">System Status</h3>
              <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span> All Operational
              </span>
            </div>
            <div className="space-y-3">
              {[
                { name: 'Authentication (Firebase)', status: 'operational' },
                { name: 'Primary Database', status: 'operational' },
                { name: 'Material Storage', status: 'operational' },
                { name: 'Models Inference Service', status: 'operational' }
              ].map((sys, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-300">{sys.name}</span>
                  <span className="text-green-500">
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* About */}
          <section className="bg-gray-800 rounded-2xl shadow-sm border border-gray-700 p-5 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-blue-500/20 rounded-full blur-xl"></div>
            <div className="absolute bottom-0 left-0 -ml-6 -mb-6 w-24 h-24 bg-purple-500/20 rounded-full blur-xl"></div>
            
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/10 rounded-xl mx-auto flex items-center justify-center backdrop-blur-sm mb-3">
                <span className="text-xl font-bold">S</span>
              </div>
              <h3 className="font-bold text-lg leading-none mb-1">StudyHub Beta</h3>
              <p className="text-gray-400 text-xs mb-4">Version 1.0.0</p>
              
              <div className="text-xs text-gray-300 space-y-1 bg-black/20 p-3 rounded-lg text-left">
                <p><span className="text-gray-500 w-20 inline-block font-medium">Developed By</span> Shalom Ufuah</p>
                <p><span className="text-gray-500 w-20 inline-block font-medium">Institution</span> Benson Idahosa Univ.</p>
                <p><span className="text-gray-500 w-20 inline-block font-medium">Cohort</span> 2026 Core</p>
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/10 flex justify-center gap-4 text-xs font-medium text-gray-400">
                <Link to="#" className="hover:text-white transition-colors">Privacy</Link>
                <Link to="#" className="hover:text-white transition-colors">Terms of Service</Link>
              </div>
            </div>
          </section>
        </div>

      </div>
    </div>
  );
};

export default HelpSupport;
