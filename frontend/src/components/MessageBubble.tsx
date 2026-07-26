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
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString();
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
          <div className="message-content" style={{ display: 'inline', wordBreak: 'break-word' }}>
            {message.content}
            <span style={{ display: 'inline-block', width: isSent ? 45 : 35, height: 1 }} />
          </div>
          
          <div className="message-meta" style={{ position: 'absolute', bottom: 4, right: 8, display: 'flex', alignItems: 'center', gap: 2 }}>
            <span className="message-time">{time}</span>
            {isSent && (
              <span className={`message-status ${message.status === 'read' ? 'read' : ''}`}>
                {message.status === 'sent' ? '✓' : message.status === 'delivered' ? '✓✓' : '✓✓'}
              </span>
            )}
          </div>
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
