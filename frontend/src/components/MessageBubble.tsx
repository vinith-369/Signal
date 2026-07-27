'use client';
import { useEffect, useState } from 'react';
import { Message } from '@/lib/types';
import Avatar from './Avatar';
import ContextMenu from './ContextMenu';

interface MessageBubbleProps {
  message: Message;
  isSent: boolean;
  isGroup: boolean;
  showAvatar: boolean;
  showSenderName: boolean;
  onDeleteMessage?: (msgId: string) => void;
}

function formatMessageTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return 'Now';
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
}

function ReadReceiptIcon({ status }: { status: string }) {
  if (status === 'read') {
    // Filled green circle with double check
    return (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
        <circle cx="12" cy="12" r="11" fill="#22C55E" />
        <path d="M6.5 12.5L9.5 15.5L17.5 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3.5 12.5L6.5 15.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (status === 'delivered') {
    // Outlined circle with double check
    return (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
        <circle cx="12" cy="12" r="11" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
        <path d="M6.5 12.5L9.5 15.5L17.5 8" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3.5 12.5L6.5 15.5" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  // sent — single check, no circle
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
      <circle cx="12" cy="12" r="11" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
      <path d="M7 12.5L10.5 16L17 8.5" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function MessageBubble({
  message,
  isSent,
  isGroup,
  showAvatar,
  showSenderName,
  onDeleteMessage
}: MessageBubbleProps) {
  const [time, setTime] = useState(() => formatMessageTime(message.created_at));
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number, y: number } | null>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(formatMessageTime(message.created_at));
    }, 60000);
    return () => clearInterval(timer);
  }, [message.created_at]);

  const senderColor = message.sender_avatar_color || '#7C3AED';

  return (
    <>
      <div className={`message-row ${isSent ? 'sent' : 'received'}`} onContextMenu={handleContextMenu}>
        {isGroup && !isSent && (
        <div style={{ width: 32, marginRight: 8, display: 'flex', alignItems: 'flex-end', flexShrink: 0 }}>
          {showAvatar && (
            <Avatar name={message.sender_name || message.sender_id} color={senderColor} size="sm" />
          )}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isSent ? 'flex-end' : 'flex-start', maxWidth: '65%' }}>
        {showSenderName && (
          <span className="message-sender-name" style={{ color: senderColor }}>
            {message.sender_name || message.sender_id.slice(0, 4)}
          </span>
        )}
        
        <div className={`message-bubble ${isSent ? 'sent' : 'received'}`}>
          <span className="message-text">{message.content}</span>
          <span className="message-meta-inline">
            <span className="message-time">{time}</span>
            {isSent && <ReadReceiptIcon status={message.status} />}
          </span>
        </div>
      </div>
    </div>
      
    <ContextMenu
        position={contextMenuPos}
        onClose={() => setContextMenuPos(null)}
        items={[
          { label: 'Pin message', onClick: () => { setContextMenuPos(null); alert('Coming soon'); } },
          { separator: true },
          { label: 'Delete for everyone', danger: true, onClick: () => { onDeleteMessage?.(message.id); setContextMenuPos(null); } }
        ]}
      />
    </>
  );
}
