import { useState, useEffect } from 'react';
import { getDoc, doc, updateDoc, collection, addDoc, serverTimestamp, getDocs, query, where, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { sendMessageToAI } from '../services/aiService';

import WelcomeScreen from '../components/ai/WelcomeScreen';
import ChatInterface from '../components/ai/ChatInterface';
import ConversationHistory from '../components/ai/ConversationHistory';
import AISettings from '../components/ai/AISettings';

const AIAssistant = () => {
  const { currentUser, userProfile: contextUserData } = useAuth();
  
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [activeContext, setActiveContext] = useState('general');
  
  const [showWelcome, setShowWelcome] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSidebarMobile, setShowSidebarMobile] = useState(false);
  
  const [toastError, setToastError] = useState(null);

  const showErrorToast = (msg) => {
    setToastError(msg);
    setTimeout(() => setToastError(null), 5000);
  };

  useEffect(() => {
    const fetchInitData = async () => {
      if (!currentUser?.uid) return;
      try {
        let uData = contextUserData;
        if (!uData) {
           const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
           if (userDoc.exists()) uData = { id: userDoc.id, ...userDoc.data() };
        }
        
        setUserData(uData || {});

        // First Time Setup Trigger
        if (!uData?.aiAssistantName) {
           setShowWelcome(true);
        }

        // Fetch Conversations
        console.log("Initializing AI Assistant... Checking .env variables.");
        const q = query(
          collection(db, 'aiConversations'), 
          where('userId', '==', currentUser.uid)
        );
        const convosSnapshot = await getDocs(q);
        const convos = convosSnapshot.docs.map(d => ({
          id: d.id, 
          ...d.data(),
          date: d.data().updatedAt?.toDate().toLocaleDateString() || 'Recently' // Simplified formatting for prototype
        }));

        // Sort in memory to avoid requiring a composite index
        convos.sort((a,b) => {
          const tA = a.updatedAt?.toMillis() || 0;
          const tB = b.updatedAt?.toMillis() || 0;
          return tB - tA;
        });

        setConversations(convos);

        if (convos.length > 0) {
          // Pass the freshly-fetched convos so loadConversation can use cached messages
          loadConversation(convos[0].id, convos);
        }
      } catch (err) {
        console.error("Error initializing AI Assistant:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, contextUserData]);

  const loadConversation = async (convId, cachedConversations) => {
    setActiveChatId(convId);
    setShowSidebarMobile(false);
    console.log(`Loading conversation: ${convId}`);

    // Use whichever conversations array was passed (avoids stale closure from useEffect)
    const convList = cachedConversations || conversations;
    const localConv = convList.find(c => c.id === convId);
    if (localConv?.messages?.length > 0) {
      console.log(`Messages loaded from cache: ${localConv.messages.length}`);
      setMessages(localConv.messages);
      return;
    }

    try {
      const convDoc = await getDoc(doc(db, 'aiConversations', convId));
      if (convDoc.exists()) {
         const data = convDoc.data();
         const msgs = data.messages || [];
         console.log(`Messages loaded from Firestore: ${msgs.length}`);
         setMessages(msgs);
         setActiveContext(data.context || 'general');
         // Back-fill local cache so subsequent clicks are instant
         setConversations(prev => prev.map(c => c.id === convId ? { ...c, messages: msgs } : c));
      } else {
         console.warn("Conversation not found in DB.");
         showErrorToast("Conversation not found in DB.");
         setMessages([]);
      }
    } catch (e) {
      console.error("Failed to load conversation doc:", e);
      showErrorToast("Failed to load conversation history.");
    }
  };

  const currentAiName = userData?.aiAssistantName || 'Study Assistant';

  const handleSaveName = async (name) => {
    const defaultSettings = {
      personality: 'friendly',
      responseLength: 'detailed',
      features: { studyReminders: false, followUpQuestions: true, showSources: false }
    };
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        aiAssistantName: name,
        aiPreferences: defaultSettings
      });
      setUserData(prev => ({ ...prev, aiAssistantName: name, aiPreferences: defaultSettings }));
      setShowWelcome(false);
    } catch (err) {
      console.error("Failed to save AI naming setup:", err);
    }
  };

  const handleUpdateSettings = async (settingsPayload) => {
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), settingsPayload);
      setUserData(prev => ({ ...prev, ...settingsPayload }));
      setShowSettings(false);
    } catch (err) {
      console.error("Failed to update AI settings:", err);
    }
  };

  const handleNewChat = () => {
    setActiveChatId(null);
    setMessages([]);
    setActiveContext('general');
    setShowSidebarMobile(false);
  };

  const handleSendMessage = async (inputContent) => {
    const userMessage = { role: 'user', content: inputContent, timestamp: Date.now() };
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      let convId = activeChatId;

      // Ensure conversation exists in Firestore
      if (!convId) {
         console.log("Creating new conversation...");
         const title = inputContent.substring(0, 40) + (inputContent.length > 40 ? '...' : '');
         const preview = inputContent.substring(0, 80);
         const newRef = await addDoc(collection(db, 'aiConversations'), {
           userId: currentUser.uid,
           aiName: currentAiName,
           title,
           preview,
           messages: [],
           context: activeContext,
           course: activeContext !== 'general' && activeContext !== 'exam-prep' && activeContext !== 'assignment-help' ? activeContext : null,
           updatedAt: serverTimestamp(),
           topics: [activeContext]
         });
         convId = newRef.id;
         console.log(`New conversation created with ID: ${convId}`);
         setActiveChatId(convId);

         // Update user stats and award points
         try {
           const { increment } = await import('firebase/firestore');
           const { awardPoints } = await import('../services/gamificationService');
           
           await updateDoc(doc(db, 'users', currentUser.uid), {
             'stats.aiConversations': increment(1)
           });
           
           await awardPoints(currentUser.uid, 5, 'AI Conversation Started', 'ai_conversation');
         } catch (e) {
           console.error("Failed to update AI stats/points", e);
         }

         // Update UI sidebar immediately with full shape (messages array so cache works)
         setConversations(prev => [{
           id: convId,
           title,
           preview,
           date: 'Just now',
           messages: [],
           topics: ['General']
         }, ...prev]);
      }

      // Send to API
      console.log("Sending message to AI...");
      const result = await sendMessageToAI(inputContent, messages, {
        ...userData,
        activeContext: activeContext,
        userId: currentUser.uid,
      });
      console.log("AI response received:", result.response || result.error);
      
      if (result.success) {
        const aiMessage = { role: 'assistant', content: result.response, timestamp: Date.now(), aiName: currentAiName };
        setMessages(prev => [...prev, aiMessage]);
        
        console.log(`Saving messages to conversation: ${convId}`);
        await updateDoc(doc(db, 'aiConversations', convId), {
           messages: arrayUnion(userMessage, aiMessage),
           updatedAt: serverTimestamp()
        });

        // Keep local cache in sync so clicking the sidebar item loads instantly
        setConversations(prev => prev.map(c =>
          c.id === convId
            ? { ...c, messages: [...(c.messages || []), userMessage, aiMessage], preview: inputContent.substring(0, 80), updatedAt: new Date() }
            : c
        ));
      } else {
        console.error("AI service failed:", result.error);
        showErrorToast(`AI Error: ${result.error}`);
        // Save the user message anyway to keep a record of what they sent
        await updateDoc(doc(db, 'aiConversations', convId), {
           messages: arrayUnion(userMessage),
           updatedAt: serverTimestamp()
        });
        setConversations(prev => prev.map(c =>
          c.id === convId
            ? { ...c, messages: [...(c.messages || []), userMessage], updatedAt: new Date() }
            : c
        ));
      }

    } catch (err) {
      console.error("Message Error:", err);
      showErrorToast("Failed to process message.");
    } finally {
      setIsTyping(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-white dark:bg-gray-800 relative overflow-hidden border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm text-gray-800 dark:text-gray-100" style={{ height: 'calc(100vh - 12rem)' }}>
      {showWelcome && (
        <WelcomeScreen 
          onSaveName={handleSaveName} 
          onSkip={() => handleSaveName('Study Assistant')} 
        />
      )}

      {showSettings && (
        <AISettings 
          onClose={() => setShowSettings(false)}
          aiName={userData?.aiAssistantName}
          preferences={userData?.aiPreferences}
          onSave={handleUpdateSettings}
        />
      )}

      {/* Sidebar - Desktop Left / Mobile Drawer */}
      <div className={`absolute md:static top-0 left-0 h-full w-72 md:w-1/4 min-w-[250px] z-20 transform transition-transform duration-300 md:translate-x-0 ${showSidebarMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
        <ConversationHistory 
           history={conversations}
           activeId={activeChatId}
           onSelectConversation={loadConversation}
           onNewChat={handleNewChat}
        />
      </div>

      {/* Mobile Backdrop Overlay */}
      {showSidebarMobile && (
        <div className="md:hidden absolute inset-0 bg-gray-900/40 z-10 animate-in fade-in" onClick={() => setShowSidebarMobile(false)}></div>
      )}

      {/* Main Chat Interface */}
      <div className="flex-1 h-full min-w-0">
        <ChatInterface 
           aiName={currentAiName}
           userPhotoUrl={currentUser?.photoURL}
           messages={messages}
           isTyping={isTyping}
           onSendMessage={handleSendMessage}
           onOpenSettings={() => setShowSettings(true)}
           onNewChat={handleNewChat}
           onToggleSidebar={() => setShowSidebarMobile(true)}
           userCourses={userData?.courses || []}
           userData={userData}
           activeContext={activeContext}
           setActiveContext={setActiveContext}
        />
      </div>

      {/* Right Information Sidecard (Desktop Only) */}
      <div className="hidden lg:flex flex-col w-1/4 min-w-[250px] max-w-[300px] border-l border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 h-full p-4 overflow-y-auto">
        <div className="bg-white dark:bg-gray-700 p-5 rounded-xl border border-gray-100 dark:border-gray-600 shadow-sm text-center mb-6">
           <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900/40 text-3xl rounded-full flex items-center justify-center mb-3">✨</div>
           <h3 className="font-black text-lg text-gray-800 dark:text-white">{currentAiName}</h3>
           <p className="text-xs font-bold text-green-500 dark:text-green-400 uppercase tracking-widest mt-1">Online & Ready</p>

           <div className="flex justify-around mt-4 pt-4 border-t border-gray-50 dark:border-gray-600 text-xs">
             <div className="text-center">
               <span className="block font-black text-xl text-gray-800 dark:text-white">{conversations.length}</span>
               <span className="text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider text-[9px]">Chats</span>
             </div>
             <div className="text-center">
               <span className="block font-black text-xl text-gray-800 dark:text-white">{messages.filter(m=>m.role==='user').length}</span>
               <span className="text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider text-[9px]">Messages</span>
             </div>
           </div>

           <button onClick={()=>setShowSettings(true)} className="mt-4 w-full py-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 bg-gray-50 dark:bg-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors border border-transparent hover:border-blue-100 dark:hover:border-blue-700">
             Open Settings
           </button>
        </div>

        <div>
          <h4 className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 px-2">Knowledge Base Areas</h4>
          {userData?.courses?.map((c, i) => (
            <div key={i} className="bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-700 text-blue-800 dark:text-blue-300 text-xs font-semibold px-3 py-2 rounded-lg mb-2 truncate">
              {c}
            </div>
          )) || <div className="text-xs text-gray-400 dark:text-gray-500 italic px-2">No courses enrolled yet.</div>}
        </div>
      </div>

      {toastError && (
        <div className="absolute top-4 right-4 z-50 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg shadow-xl animate-in fade-in slide-in-from-top-4 flex items-center gap-3">
          <div className="shrink-0 bg-red-100 rounded-full p-1">
             <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <div>
            <strong className="block font-bold text-sm">Action Failed</strong>
            <span className="block text-xs font-medium text-red-600 mt-0.5">{toastError}</span>
          </div>
        </div>
      )}

    </div>
  );
};

export default AIAssistant;
