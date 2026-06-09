import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Sparkles, Copy, ThumbsUp, ThumbsDown } from 'lucide-react';

const MessageBubble = ({ message, aiName, userPhotoUrl }) => {
  const isAI = message.role === 'assistant';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (message.role === 'system') {
    return (
      <div className="w-full flex justify-center my-4 animate-in fade-in">
        <span className="bg-gray-100/80 dark:bg-gray-700/80 text-gray-500 dark:text-gray-400 text-xs italic px-4 py-1.5 rounded-full font-medium shadow-sm">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex w-full mb-6 animate-in slide-in-from-bottom-2 duration-300 ${isAI ? 'justify-start' : 'justify-end'}`}>

      {/* AI Avatar */}
      {isAI && (
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/40 dark:to-blue-900/40 border border-blue-200 dark:border-blue-700 flex items-center justify-center shadow-sm shrink-0 mr-3 mt-1 self-start">
          <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-blue-600 dark:text-blue-400" />
        </div>
      )}

      {/* Bubble Container */}
      <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${isAI ? 'items-start' : 'items-end'}`}>

        {isAI && (
          <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 ml-1 mb-1 tracking-wide uppercase">
            {aiName}
          </span>
        )}

        <div
          className={`relative group px-4 py-3 md:px-5 md:py-4 shadow-sm text-[15px] leading-relaxed
            ${isAI
              ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-2xl rounded-tl-none border border-gray-100 dark:border-gray-600'
              : 'bg-blue-600 text-white rounded-2xl border border-blue-700/50 rounded-tr-none'
            }`}
        >
          {isAI ? (
            <div className="prose prose-sm prose-blue dark:prose-invert max-w-none text-gray-800 dark:text-gray-100 tracking-tight">
              <ReactMarkdown
                components={{
                  code({node, inline, className, children, ...props}) {
                  return inline ? (
                    <code className="bg-gray-100 dark:bg-gray-700 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded font-mono text-sm font-semibold" {...props}>
                      {children}
                    </code>
                  ) : (
                    <div className="relative group/code mt-4 mb-2">
                      <pre className="bg-gray-900 !text-gray-100 p-4 rounded-xl overflow-x-auto shadow-inner text-sm leading-normal">
                        <code {...props}>{children}</code>
                      </pre>
                      <button
                        className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 text-white text-[10px] px-2 py-1 rounded transition-colors opacity-0 group-hover/code:opacity-100 focus:opacity-100"
                        onClick={() => navigator.clipboard.writeText(String(children))}
                      >
                        Copy
                      </button>
                    </div>
                  );
                },
                ul: ({node, ...props}) => <ul className="list-disc pl-5 my-2 space-y-1" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-2 space-y-1" {...props} />,
                p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                // eslint-disable-next-line jsx-a11y/anchor-has-content
                a: ({node, ...props}) => <a className="text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-0.5 rounded transition" {...props} />
              }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="whitespace-pre-wrap font-medium">
              {message.content}
            </div>
          )}

          {/* AI Hover Tools */}
          {isAI && (
            <div className="absolute -right-2 top-0 translate-x-full opacity-0 group-hover:opacity-100 transition-opacity flex-col gap-1 hidden md:flex">
                <button onClick={handleCopy} className="p-1.5 bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md shadow-sm relative">
                  <Copy className="w-4 h-4" />
                  {copied && <span className="absolute left-full ml-2 text-[10px] bg-gray-800 text-white px-1.5 rounded whitespace-nowrap">Copied!</span>}
                </button>
                <div className="flex bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-md shadow-sm mt-1">
                  <button className="p-1 text-gray-400 hover:text-green-500 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-l-md transition"><ThumbsUp className="w-4 h-4" /></button>
                  <button className="p-1 text-gray-400 hover:text-red-500 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-r-md transition border-l border-gray-50 dark:border-gray-600"><ThumbsDown className="w-4 h-4" /></button>
                </div>
            </div>
          )}
        </div>

        <span className={`text-[10px] font-semibold text-gray-400 dark:text-gray-500 mt-1.5 mx-1 ${isAI ? 'text-left' : 'text-right'}`}>
          {message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now'}
        </span>
      </div>

      {/* User Avatar */}
      {!isAI && (
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 border-2 border-white dark:border-gray-700 shadow-sm flex items-center justify-center font-bold text-blue-700 dark:text-blue-300 shrink-0 ml-3 mt-1 self-start overflow-hidden">
          {userPhotoUrl ? <img src={userPhotoUrl} alt="User" className="w-full h-full object-cover" /> : 'U'}
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
