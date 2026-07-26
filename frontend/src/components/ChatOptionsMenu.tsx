'use client';

import { useEffect, useRef } from 'react';
import { Conversation } from '@/lib/types';

interface ChatOptionsMenuProps {
  conversation: Conversation;
  onClose: () => void;
  onPin: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onMute: () => void;
  onShowGroupInfo?: () => void;
}

export default function ChatOptionsMenu({
  conversation,
  onClose,
  onPin,
  onArchive,
  onDelete,
  onMute,
  onShowGroupInfo
}: ChatOptionsMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      onDelete();
      onClose();
    }
  };

  return (
    <div ref={menuRef} className="context-menu" style={{ position: 'absolute', top: 60, right: 16, zIndex: 50 }}>
      <button className="context-menu-item" onClick={onClose} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Disappearing messages
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
      </button>
      <button className="context-menu-item" onClick={() => { onMute(); onClose(); }}>
        Mute notifications
      </button>
      <button className="context-menu-item" onClick={() => { 
        if (conversation.type === 'group' && onShowGroupInfo) {
          onShowGroupInfo();
        }
        onClose(); 
      }}>
        {conversation.type === 'group' ? 'Group settings' : 'Chat settings'}
      </button>
      <button className="context-menu-item" onClick={onClose}>
        All media
      </button>
      <button className="context-menu-item" onClick={onClose}>
        Select messages
      </button>
      <button className="context-menu-item" onClick={onClose}>
        Mark as unread
      </button>
      <div className="context-menu-separator"></div>
      <button className="context-menu-item" onClick={() => { onPin(); onClose(); }}>
        Pin chat
      </button>
      <button className="context-menu-item" onClick={() => { onArchive(); onClose(); }}>
        Archive
      </button>
      <button className="context-menu-item" onClick={onClose}>
        Block
      </button>
      <button className="context-menu-item danger" onClick={handleDelete}>
        Delete
      </button>
    </div>
  );
}
