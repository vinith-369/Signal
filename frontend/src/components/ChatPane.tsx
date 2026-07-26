'use client';

import { useState } from 'react';
import { Conversation, Message, User } from '@/lib/types';
import { WebSocketClient } from '@/lib/websocket';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ChatOptionsMenu from './ChatOptionsMenu';

interface ChatPaneProps {
  conversation: Conversation;
  messages: Message[];
  currentUser: User;
  typingUsers: Record<string, boolean>;
  onSendMessage: (content: string) => void;
  onLoadMore: () => void;
  wsClient: WebSocketClient | null;
  onPin?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onDeleteMessage?: (msgId: string) => void;
  onShowGroupInfo?: () => void;
}

export default function ChatPane({
  conversation,
  messages,
  currentUser,
  typingUsers,
  onSendMessage,
  onLoadMore,
  wsClient,
  onPin,
  onArchive,
  onDelete,
  onDeleteMessage,
  onShowGroupInfo
}: ChatPaneProps) {
  const [showOptions, setShowOptions] = useState(false);

  const handleTyping = (isTyping: boolean) => {
    wsClient?.sendTyping(conversation.id, isTyping);
  };

  return (
    <>
      <ChatHeader
        conversation={conversation}
        currentUser={currentUser}
        onShowOptions={() => setShowOptions(!showOptions)}
      />
      {showOptions && (
        <ChatOptionsMenu
          conversation={conversation}
          onClose={() => setShowOptions(false)}
          onPin={() => { onPin?.(); setShowOptions(false); }}
          onArchive={() => { onArchive?.(); setShowOptions(false); }}
          onDelete={() => { onDelete?.(); setShowOptions(false); }}
          onMute={() => setShowOptions(false)}
          onShowGroupInfo={() => { onShowGroupInfo?.(); setShowOptions(false); }}
        />
      )}
      <div className="messages-container">
        <MessageList
          messages={messages}
          currentUser={currentUser}
          conversation={conversation}
          typingUsers={typingUsers}
          onLoadMore={onLoadMore}
          onDeleteMessage={onDeleteMessage}
        />
      </div>
      <MessageInput onSend={onSendMessage} onTyping={handleTyping} />
    </>
  );
}
