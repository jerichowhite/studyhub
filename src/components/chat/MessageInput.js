import { useState, useRef, useEffect, useCallback } from 'react';

const EMOJI_LIST = ['😊','😂','🔥','👍','❤️','🙏','😮','🤔','🎉','😅','💪','✅','📚','🧠','✨'];

const MessageInput = ({ onSend, onTyping, disabled = false, autoFocus = false }) => {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [toast, setToast] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }, [text]);

  useEffect(() => {
    if (autoFocus && textareaRef.current) textareaRef.current.focus();
  }, [autoFocus]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || sending || disabled) return;

    setSending(true);
    try {
      await onSend(trimmed);
      setText('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    } catch {
      showToast('Failed to send message. Try again.');
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  }, [text, sending, disabled, onSend]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e) => {
    setText(e.target.value);
    if (onTyping) onTyping();
  };

  const insertEmoji = (emoji) => {
    const el = textareaRef.current;
    if (!el) { setText(t => t + emoji); return; }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = text.slice(0, start) + emoji + text.slice(end);
    setText(next);
    setShowEmoji(false);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  const canSend = text.trim().length > 0 && !sending && !disabled;

  return (
    <div className="relative border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
      {/* Toast */}
      {toast && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full bg-red-500 text-white text-xs px-4 py-1.5 rounded-full shadow mb-1">
          {toast}
        </div>
      )}

      {/* Emoji picker */}
      {showEmoji && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setShowEmoji(false)} />
          <div className="absolute bottom-full left-4 mb-2 z-40 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl shadow-xl p-3 flex flex-wrap gap-2 w-64">
            {EMOJI_LIST.map((em) => (
              <button
                key={em}
                onClick={() => insertEmoji(em)}
                className="text-xl hover:scale-125 transition-transform"
              >
                {em}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="flex items-end gap-2">
        {/* Emoji toggle */}
        <button
          onClick={() => setShowEmoji((v) => !v)}
          disabled={disabled}
          className="mb-1 text-xl text-gray-400 hover:text-yellow-500 transition-colors shrink-0 disabled:opacity-40"
          title="Emoji"
          aria-label="Emoji"
        >
          😊
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled || sending}
          placeholder="Type a message…"
          maxLength={1000}
          rows={1}
          className="flex-1 resize-none rounded-2xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-800 dark:text-gray-100
            focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
            placeholder:text-gray-400 dark:placeholder:text-gray-500 disabled:opacity-50 transition-all
            min-h-[44px] max-h-[120px] leading-relaxed"
          style={{ overflowY: 'auto' }}
        />

        {/* Attachment (future) */}
        <button
          onClick={() => showToast('File sharing coming soon!')}
          disabled={disabled}
          className="mb-1 text-gray-400 dark:text-gray-500 hover:text-blue-500 transition-colors shrink-0 disabled:opacity-40"
          title="Attach file (coming soon)"
          aria-label="Attach file"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>

        {/* Send */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          className={`mb-1 w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all
            ${canSend
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg hover:scale-105'
              : 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }`}
          aria-label="Send message"
        >
          {sending ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          )}
        </button>
      </div>

      <p className="text-[10px] text-gray-300 dark:text-gray-600 text-right mt-1 pr-14">
        {text.length}/1000 · Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
};

export default MessageInput;
