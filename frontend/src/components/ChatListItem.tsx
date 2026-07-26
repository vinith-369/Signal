'use client';
import { useState, useEffect } from 'react';
import { Conversation } from '@/lib/types';
import Avatar from './Avatar';
import ContextMenu from './ContextMenu';

interface ChatListItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
  currentUserId: string;
  onPin?: () => void;
  onArchive?: () => void;
  onUnarchive?: () => void;
  onDelete?: () => void;
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'Now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 172800) return 'Yesterday';
  return date.toLocaleDateString();
}

export default function ChatListItem({ conversation, isSelected, onClick, currentUserId, onPin, onArchive, onUnarchive, onDelete }: ChatListItemProps) {
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  const otherMember = conversation.type === 'group' ? null : conversation.members.find(m => m.id !== currentUserId);
  const displayName = conversation.type === 'group' ? conversation.name : (otherMember?.display_name || otherMember?.username || 'Unknown');
  const avatarColor = conversation.type === 'group' ? '#2C6BED' : (otherMember?.avatar_color || '#7C3AED');
  const avatarUrl = conversation.type === 'group' ? undefined : otherMember?.avatar_url;
  const isOnline = otherMember?.is_online;
  
  const lastMessage = conversation.last_message;
  let lastMessagePreview = lastMessage?.content || '';
  if (conversation.type === 'group' && lastMessage && lastMessage.sender_id !== currentUserId) {
    const sender = conversation.members.find(m => m.id === lastMessage.sender_id);
    const senderName = sender?.display_name?.split(' ')[0] || 'Someone';
    lastMessagePreview = `${senderName}: ${lastMessagePreview}`;
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  };

  return (
    <>
      <div 
        className={`chat-list-item ${isSelected ? 'active' : ''}`} 
        onClick={onClick}
        onContextMenu={handleContextMenu}
      >
        <Avatar name={displayName || 'User'} color={avatarColor} size="lg" imageUrl={avatarUrl} isGroup={conversation.type === 'group'} isOnline={isOnline} />
        
        <div className="chat-list-item-info">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className={`chat-list-item-name ${conversation.unread_count ? 'unread' : ''}`}>
              {displayName}
            </span>
            {lastMessage && (
              <div className="chat-list-item-meta">
                <span className="chat-list-item-time">{formatRelativeTime(lastMessage.created_at)}</span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
            <span className="chat-list-item-preview">
              {lastMessage && lastMessage.sender_id === currentUserId && (
                <span className={`chat-list-item-status ${lastMessage.status === 'read' ? 'read' : ''}`} style={{ marginRight: 4 }}>
                  {lastMessage.status === 'sent' ? '✓' : lastMessage.status === 'delivered' ? '✓✓' : '✓✓'}
                </span>
              )}
              {lastMessagePreview}
            </span>
            {conversation.unread_count ? (
              <div className="unread-badge">{conversation.unread_count}</div>
            ) : null}
          </div>
        </div>
      </div>

      {contextMenuPos && (
        <ContextMenu 
          position={contextMenuPos}
          onClose={() => setContextMenuPos(null)}
          items={[
            { label: conversation.is_pinned ? 'Unpin chat' : 'Pin chat', onClick: () => { onPin?.(); setContextMenuPos(null); } },
            conversation.is_archived
              ? { label: 'Unarchive', onClick: () => { onUnarchive?.(); setContextMenuPos(null); } }
              : { label: 'Archive', onClick: () => { onArchive?.(); setContextMenuPos(null); } },
            { separator: true },
            { label: 'Delete', danger: true, onClick: () => { onDelete?.(); setContextMenuPos(null); } }
          ]}
        />
      )}
    </>
  );
}
