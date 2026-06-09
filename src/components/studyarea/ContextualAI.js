import { useState, useEffect, useRef } from 'react';
import { Bot, Calendar, Pencil, BookOpen, Target, Send, X, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { sendMessageToAI } from '../../services/aiService';

const todayClasses = (schedule) => {
  const now   = new Date();
  const start = new Date(now); start.setHours(0, 0, 0, 0);
  const end   = new Date(now); end.setHours(23, 59, 59, 999);
  return schedule.filter((e) => e.start >= start && e.start <= end);
};

const upcomingClasses = (schedule, days = 7) => {
  const now    = new Date();
  const future = new Date(now.getTime() + days * 86400000);
  return schedule
    .filter((e) => e.start > now && e.start <= future)
    .sort((a, b) => a.start - b.start)
    .slice(0, 5);
};

const nextExam = (schedule) => {
  const now = new Date();
  return schedule
    .filter((e) => e.type === 'exam' && e.start > now)
    .sort((a, b) => a.start - b.start)[0] || null;
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric' }) : '';

const QUICK_PROMPTS = [
  { Icon: Calendar, label: "What's my schedule today?",          color: 'blue'   },
  { Icon: Pencil,   label: 'Explain something on my whiteboard', color: 'purple' },
  { Icon: BookOpen, label: 'Help me understand my open file',     color: 'green'  },
  { Icon: Target,   label: 'Create a study plan for my next exam', color: 'orange' },
];

const ContextualAI = ({ whiteboardContent, schedule = [], openFile, userCourses = [] }) => {
  const { currentUser, userProfile } = useAuth();
  const [isOpen,    setIsOpen]    = useState(false);
  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState('');
  const [thinking,  setThinking]  = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  useEffect(() => {
    if (!openFile) return;
    setIsOpen(true);
    const msg = `I'd like help understanding this file: "${openFile.title}" (${openFile.courseCode})`;
    if (!messages.some((m) => m.content === msg)) {
      sendMessage(msg);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openFile]);

  const buildContext = () => ({
    whiteboardSummary: whiteboardContent?.textSummary || '',
    hasStickies: (whiteboardContent?.stickies?.length || 0) > 0,
    stickyNotes: whiteboardContent?.stickies?.map((s) => s.text).join(' | ') || '',
    todaySchedule: todayClasses(schedule),
    upcoming: upcomingClasses(schedule),
    nextExam: nextExam(schedule),
    currentFile: openFile
      ? { title: openFile.title, course: openFile.courseCode, type: openFile.fileType }
      : null,
    currentTime: new Date().toLocaleString('en-NG'),
  });

  const sendMessage = async (overrideText) => {
    const text = (overrideText ?? input).trim();
    if (!text) return;
    if (!overrideText) setInput('');

    const userMsg = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setThinking(true);

    const context = buildContext();
    const profile = userProfile || {};

    const result = await sendMessageToAI(text, messages, {
      aiName:          profile.aiAssistantName || 'Study Assistant',
      displayName:     profile.displayName || currentUser?.displayName || 'Student',
      level:           profile.level || '',
      department:      profile.department || '',
      university:      'Benson Idahosa University',
      courses:         userCourses,
      personality:     profile.aiPersonality || 'friendly',
      responseLength:  profile.aiResponseLength || 'detailed',
      studyAreaContext: context,
    });

    setThinking(false);
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', content: result.success ? result.response : `Error: ${result.error}` },
    ]);
  };

  const today = todayClasses(schedule);
  const exam  = nextExam(schedule);

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center justify-center z-50"
        >
          <Bot className="w-7 h-7 relative z-10" />
          <span className="absolute inset-0 rounded-full bg-purple-400 opacity-40 animate-ping" />
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col z-50 border border-purple-100 dark:border-purple-900/40 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <div>
                <p className="font-bold text-sm leading-tight">Study Assistant</p>
                <p className="text-xs opacity-80">Context-aware AI</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Context badges */}
          <div className="bg-purple-50 dark:bg-purple-900/20 px-3 py-2 border-b border-purple-100 dark:border-purple-900/40 flex-shrink-0">
            <p className="text-[10px] font-semibold text-purple-800 dark:text-purple-300 mb-1.5">I can see:</p>
            <div className="flex flex-wrap gap-1.5">
              {whiteboardContent?.textSummary && (
                <span className="text-[10px] bg-white dark:bg-gray-700 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300 flex items-center gap-1">
                  <Pencil className="w-3 h-3" /> Whiteboard notes
                </span>
              )}
              {today.length > 0 && (
                <span className="text-[10px] bg-white dark:bg-gray-700 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {today.length} class{today.length !== 1 ? 'es' : ''} today
                </span>
              )}
              {exam && (
                <span className="text-[10px] bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 flex items-center gap-1">
                  <Target className="w-3 h-3" /> Exam {fmtDate(exam.start)}
                </span>
              )}
              {openFile && (
                <span className="text-[10px] bg-white dark:bg-gray-700 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300 truncate max-w-[140px] flex items-center gap-1">
                  <FileText className="w-3 h-3 shrink-0" /> {openFile.title}
                </span>
              )}
              {!whiteboardContent?.textSummary && today.length === 0 && !openFile && (
                <span className="text-[10px] text-purple-400 dark:text-purple-500">Your schedule · whiteboard · open files</span>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
            {messages.length === 0 && (
              <div className="py-4">
                <p className="text-xs text-center text-gray-400 dark:text-gray-500 mb-3">Ask me anything about your studies:</p>
                <div className="space-y-2">
                  {QUICK_PROMPTS.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => sendMessage(p.label)}
                      className={`flex items-center gap-2 w-full text-left text-xs bg-${p.color}-50 dark:bg-${p.color}-900/20 text-${p.color}-700 dark:text-${p.color}-400 px-3 py-2 rounded-lg hover:bg-${p.color}-100 dark:hover:bg-${p.color}-900/40 transition`}
                    >
                      <p.Icon className="w-4 h-4 shrink-0" />
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {thinking && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2.5 rounded-2xl rounded-bl-sm">
                  <div className="flex gap-1 items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-gray-100 dark:border-gray-700 flex-shrink-0">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Ask about your study materials…"
                className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 rounded-full focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none"
                disabled={thinking}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || thinking}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white w-9 h-9 rounded-full flex items-center justify-center hover:shadow-md transition disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ContextualAI;
