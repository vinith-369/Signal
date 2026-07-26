'use client';

import { useState, useRef, useEffect } from 'react';

interface MessageInputProps {
  onSend: (content: string) => void;
  onTyping: (isTyping: boolean) => void;
}

export default function MessageInput({ onSend, onTyping }: MessageInputProps) {
  const [content, setContent] = useState('');
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [content]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    onTyping(true);
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 2000);
  };

  const handleSend = () => {
    if (content.trim()) {
      onSend(content.trim());
      setContent('');
      onTyping(false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="message-input-container">
      <button className="message-input-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 14s1.5 2 4 2 4-2 4-2" />
          <line x1="9" y1="9" x2="9.01" y2="9" />
          <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
      </button>
      
      <div style={{ flex: 1, backgroundColor: 'var(--input-bg)', borderRadius: '20px', display: 'flex', alignItems: 'flex-end', padding: '6px 12px', border: '1px solid var(--border-color)' }}>
        <button className="message-input-btn" style={{ padding: '0 8px 4px 0' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14m-7-7h14" />
          </svg>
        </button>
        
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Signal message"
          className="message-input"
          rows={1}
          style={{ paddingBottom: '4px' }}
        />
      </div>

      <button className="message-input-btn" style={{ marginLeft: 8 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      </button>
    </div>
  );
}
