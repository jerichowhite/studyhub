import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles, Plus, Settings, Menu, Send, Paperclip,
  MessageSquare, BookOpen, ClipboardList, PenLine,
} from 'lucide-react';
import MessageBubble from './MessageBubble';

const ChatInterface = ({
  aiName,
  userPhotoUrl,
  messages,
  isTyping,
  onSendMessage,
  onOpenSettings,
  onNewChat,
  onToggleSidebar,
  userCourses = [],
  userData,
  activeContext,
  setActiveContext
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim() || isTyping) return;
    onSendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedTopics = [
    ...userCourses.map(course => ({
      label: `Explain a concept from ${course}`,
      prompt: `Can you explain a key concept from ${course}? I'm studying for my ${userData?.level || ''} level course.`,
      category: 'course'
    })),
    ...userCourses.map(course => ({
      label: `Practice questions for ${course}`,
      prompt: `Generate 5 practice questions for ${course} to help me prepare for my exam.`,
      category: 'course'
    })),
    {
      label: 'Create a study plan',
      prompt: `Help me create a study plan for my courses: ${userCourses.join(', ')}. I'm a ${userData?.level || ''} level ${userData?.department || ''} student.`,
      category: 'general'
    },
    {
      label: 'Explain like I\'m in 100 level',
      prompt: 'Can you explain this concept in very simple terms, as if I\'m just starting university?',
      category: 'general'
    },
    {
      label: 'Quiz me on today\'s material',
      prompt: 'I just finished studying. Can you quiz me on what I learned to test my understanding?',
      category: 'general'
    },
    {
      label: 'Break down this assignment',
      prompt: 'I have an assignment I need help understanding. Can you help me break it down into manageable steps? (I\'ll paste the assignment details)',
      category: 'general'
    },
    {
      label: 'Study tips for exams',
      prompt: `I have exams coming up for ${userCourses[0] || 'my courses'}. What are the best study strategies and tips you can give me?`,
      category: 'general'
    }
  ];

  const handleTopicClick = (topic) => {
    setInput(topic.prompt);
    inputRef.current?.focus();
  };

  const contextOptions = [
    { id: 'general',         label: 'General Chat',      Icon: MessageSquare  },
    ...userCourses.map(course => ({
      id:    course?.toLowerCase().replace(/\s+/g, '_') || course,
      label: course,
      Icon:  BookOpen,
    })),
    { id: 'exam-prep',       label: 'Exam Preparation',  Icon: ClipboardList  },
    { id: 'assignment-help', label: 'Assignment Help',   Icon: PenLine        },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 relative">

      {/* Top Header */}
      <div className="absolute top-0 w-full h-[60px] bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-700 z-10 px-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <div className="flex flex-col">
              <h3 className="font-bold text-gray-800 dark:text-white text-sm leading-tight">{aiName}</h3>
              <span className="text-[10px] text-green-600 dark:text-green-400 font-bold flex items-center gap-1 uppercase tracking-wide">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> Online
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
             onClick={onNewChat}
             className="hidden sm:flex text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-3 py-1.5 rounded-lg transition-colors items-center gap-1"
          >
             <Plus className="w-3 h-3" />
             New Chat
          </button>
          <button
            onClick={onOpenSettings}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Message Stream */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 tracking-[-0.01em] bg-gray-50 dark:bg-gray-900 pt-20 pb-4">

        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center max-w-lg mx-auto text-center animate-in fade-in duration-700">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-50 dark:from-blue-900/40 dark:to-indigo-900/40 rounded-2xl flex items-center justify-center shadow-sm border border-blue-200 dark:border-blue-700 mt-[-10vh]">
               <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-black text-gray-800 dark:text-white mt-6 mb-2">Hello! I&apos;m {aiName}</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm font-medium">How can I help you with your studies today? Feel free to ask a question or try one of these starters:</p>

            {/* Context Selector */}
            <div className="w-full text-left mb-6">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-widest">I want help with:</p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                {contextOptions.map(({ id, label, Icon: CtxIcon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveContext(id)}
                    className={`
                      flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors shadow-sm
                      ${activeContext === id
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    <CtxIcon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full text-left space-y-5">
              {userCourses.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest">Your Courses</p>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                    {suggestedTopics
                      .filter(t => t.category === 'course')
                      .slice(0, 6)
                      .map((topic, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleTopicClick(topic)}
                          className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full border border-blue-200 dark:border-blue-700 transition"
                        >
                          {topic.label}
                        </button>
                      ))
                    }
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest">Study Help</p>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                  {suggestedTopics
                    .filter(t => t.category === 'general')
                    .slice(0, 5)
                    .map((topic, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleTopicClick(topic)}
                        className="px-3 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-full border border-gray-200 dark:border-gray-600 transition shadow-sm"
                      >
                        {topic.label}
                      </button>
                    ))
                  }
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto flex flex-col pt-4">

            {activeContext && activeContext !== 'general' && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-3 mb-6 shadow-sm mx-4 sm:mx-0 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const found = contextOptions.find(c => c.id === activeContext);
                      const FoundIcon = found?.Icon || BookOpen;
                      return (
                        <span className="text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 p-1.5 rounded-lg shadow-sm border border-blue-100 dark:border-blue-700 flex items-center">
                          <FoundIcon className="w-5 h-5" />
                        </span>
                      );
                    })()}
                    <div>
                      <p className="text-sm font-bold text-blue-900 dark:text-blue-200">
                        Current Topic: {contextOptions.find(c => c.id === activeContext)?.label || activeContext}
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        {aiName} is focusing responses on this topic
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveContext('general')}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-white hover:bg-blue-600 px-3 py-1.5 rounded-lg border border-transparent transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

            <MessageBubble
              key="sys-start"
              message={{ role: 'system', content: `Conversation started with ${aiName}` }}
            />

            {messages.map((msg, index) => (
              <MessageBubble
                key={index}
                message={msg}
                aiName={aiName}
                userPhotoUrl={userPhotoUrl}
              />
            ))}

            {isTyping && (
              <div className="flex w-full mb-6 py-2 px-1 animate-in fade-in">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/40 dark:to-blue-900/40 border dark:border-gray-600 flex items-center justify-center shadow-sm shrink-0 mr-3">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
                <div className="bg-white dark:bg-gray-800 border dark:border-gray-600 text-gray-500 dark:text-gray-400 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1 shadow-sm">
                   <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                   <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                   <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="shrink-0 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] p-4 sm:p-6 pb-safe">
        <div className="max-w-3xl mx-auto relative rounded-2xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-800 focus-within:border-blue-400 dark:focus-within:border-blue-500 transition-all flex items-end">

          <button className="p-3 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shrink-0">
            <Paperclip className="w-5 h-5" />
          </button>

          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, 2000))}
            onKeyDown={handleKeyDown}
            placeholder={`Ask ${aiName} anything... (Shift+Enter for new line)`}
            className="w-full resize-none bg-transparent pt-3.5 pb-3 px-2 outline-none max-h-32 min-h-[44px] text-gray-800 dark:text-gray-100 font-medium placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:placeholder:text-gray-300"
            rows={input.split('\n').length > 1 ? Math.min(input.split('\n').length, 5) : 1}
            disabled={isTyping}
          />

          <div className="absolute right-2 sm:right-16 bottom-1 transform translate-y-full pt-1">
             <span className="text-[10px] text-gray-300 dark:text-gray-600 font-bold">{input.length}/2000</span>
          </div>

          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="m-1.5 p-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 dark:disabled:bg-gray-600 disabled:text-gray-400 dark:disabled:text-gray-500 text-white transition-colors shrink-0"
          >
            {isTyping ? (
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
