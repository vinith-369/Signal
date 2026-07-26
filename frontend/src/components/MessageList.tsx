'use client';

import { useEffect, useRef, useState } from 'react';
import { Conversation, Message, User } from '@/lib/types';
import ProfileCard from './ProfileCard';
import MessageBubble from './MessageBubble';

interface MessageListProps {
  messages: Message[];
  currentUser: User;
  conversation: Conversation;
  typingUsers: Record<string, boolean>;
  onLoadMore: () => void;
  onDeleteMessage?: (msgId: string) => void;
}

export default function MessageList({
  messages,
  currentUser,
  conversation,
  typingUsers,
  onLoadMore,
  onDeleteMessage
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const previousScrollHeight = useRef<number>(0);
  const previousMessagesLength = useRef<number>(0);
  const isGroup = conversation.type === 'group';

  useEffect(() => {
    const list = scrollRef.current;
    if (!list) return;

    if (messages.length > previousMessagesLength.current && previousMessagesLength.current > 0) {
      if (list.scrollTop === 0) {
        list.scrollTop = list.scrollHeight - previousScrollHeight.current;
      } else {
        const isAtBottom = previousScrollHeight.current - list.scrollTop <= list.clientHeight + 100;
        if (isAtBottom) {
          list.scrollTop = list.scrollHeight;
        }
      }
    } else if (previousMessagesLength.current === 0 || messages.length <= 50) {
      list.scrollTop = list.scrollHeight;
    }

    previousScrollHeight.current = list.scrollHeight;
    previousMessagesLength.current = messages.length;
  }, [messages, typingUsers]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop === 0) {
      onLoadMore();
    }
  };

  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    msgs.forEach(m => {
      const date = new Date(m.created_at);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let dateStr = date.toLocaleDateString();
      if (date.toDateString() === today.toDateString()) {
        dateStr = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateStr = 'Yesterday';
      }

      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(m);
    });
    return groups;
  };

  const grouped = groupMessagesByDate(messages);
  const activeTypers = Object.entries(typingUsers).filter(([_, isTyping]) => isTyping).map(([id]) => id);

  return (
    <div 
      ref={scrollRef}
      onScroll={handleScroll}
      style={{ overflowY: 'auto', flex: 1, padding: '16px', display: 'flex', flexDirection: 'column' }}
    >
      <ProfileCard conversation={conversation} currentUser={currentUser} />
      
      {Object.entries(grouped).map(([date, msgs]) => (
        <div key={date} style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="date-separator">
            <span>{date}</span>
          </div>
          {msgs.map((m, idx) => {
            const isSent = m.sender_id === currentUser.id;
            const prev = msgs[idx - 1];
            const showAvatar = !isSent && (!prev || prev.sender_id !== m.sender_id);
            const showSenderName = isGroup && !isSent && (!prev || prev.sender_id !== m.sender_id);

            return (
              <MessageBubble
                key={m.id}
                message={m}
                isSent={isSent}
                isGroup={isGroup}
                showAvatar={showAvatar}
                showSenderName={showSenderName}
                onDeleteMessage={onDeleteMessage}
              />
            );
          })}
        </div>
      ))}
      
      {activeTypers.length > 0 && (
        <div className="typing-indicator" style={{ marginLeft: isGroup ? 40 : 0 }}>
          <span />
          <span />
          <span />
        </div>
      )}
    </div>
  );
}
