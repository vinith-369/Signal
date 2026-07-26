'use client';
import { useEffect, useState } from 'react';
import { Conversation, User } from '@/lib/types';
import Avatar from './Avatar';

interface ChatHeaderProps {
  conversation: Conversation;
  currentUser: User;
  onShowOptions: () => void;
}

function formatLastSeen(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - d.getTime()) / 60000);
  
  if (diffMinutes < 1) return 'last seen just now';
  if (diffMinutes < 60) return `last seen ${diffMinutes}m ago`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `last seen ${diffHours}h ago`;
  
  return `last seen ${d.toLocaleDateString()}`;
}

export default function ChatHeader({ conversation, currentUser, onShowOptions }: ChatHeaderProps) {
  const [toast, setToast] = useState('');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const isGroup = conversation.type === 'group';
  
  let avatarUrl = '';
  let title = '';
  let subtitle = '';
  let color = '#2C6BED';

  if (isGroup) {
    title = conversation.name || 'Group Chat';
    subtitle = `${conversation.members?.length || 0} members`;
  } else {
    const otherMember = conversation.members?.find(m => m.id !== currentUser.id);
    title = otherMember?.display_name || otherMember?.username || 'Unknown User';
    color = otherMember?.avatar_color || '#7C3AED';
    avatarUrl = otherMember?.avatar_url || '';
    
    if (otherMember?.is_online) {
      subtitle = 'Online';
    } else if (otherMember?.last_seen) {
      subtitle = formatLastSeen(otherMember.last_seen);
    } else {
      subtitle = 'Offline';
    }
  }

  return (
    <div className="chat-header">
      <div className="chat-header-info">
        <Avatar name={title} color={color} size="md" imageUrl={avatarUrl} isGroup={isGroup} isOnline={conversation.type === 'direct' && conversation.members?.find(m => m.id !== currentUser.id)?.is_online} />
        <div>
          <h2 className="chat-header-name">{title}</h2>
          <p className="chat-header-subtitle">{subtitle}</p>
        </div>
      </div>

      <div className="chat-header-actions">
        <button onClick={() => showToast('Coming Soon')} className="chat-header-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v-4z" />
            <rect x="3" y="6" width="12" height="12" rx="2" />
          </svg>
        </button>
        <button onClick={() => showToast('Coming Soon')} className="chat-header-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
          </svg>
        </button>
        <button className="chat-header-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
        <button onClick={onShowOptions} className="chat-header-btn">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="12" cy="19" r="2" />
          </svg>
        </button>
      </div>

      {toast && (
        <div style={{position: 'absolute', top: 60, right: 20, background: 'var(--modal-bg)', padding: '8px 16px', borderRadius: 4, zIndex: 100, border: '1px solid var(--border-color)'}}>
          {toast}
        </div>
      )}
    </div>
  );
}
