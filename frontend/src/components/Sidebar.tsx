'use client';
import { SidebarView, Conversation, Contact } from '@/lib/types';
import ChatList from './ChatList';
import CallsList from './CallsList';
import StoriesList from './StoriesList';
import Settings from './Settings';
import { useAuth } from '@/lib/auth';

interface SidebarProps {
  activeView: SidebarView;
  conversations: Conversation[];
  contacts: Contact[];
  onSelectConversation: (conversation: Conversation) => void;
  selectedConversationId: string | null;
  onNewChat: () => void;
  onRefresh: () => void;
  onShowProfile: () => void;
  onPin?: (id: string) => void;
  onArchive?: (id: string) => void;
  onUnarchive?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function Sidebar({
  activeView,
  conversations,
  contacts,
  onSelectConversation,
  selectedConversationId,
  onNewChat,
  onRefresh,
  onShowProfile,
  onPin,
  onArchive,
  onUnarchive,
  onDelete
}: SidebarProps) {
  const { user } = useAuth();
  
  if (!user) return null;

  return (
    <>
      {activeView === 'chats' && (
        <ChatList 
          conversations={conversations}
          selectedId={selectedConversationId}
          onSelect={onSelectConversation}
          onNewChat={onNewChat}
          user={user}
          onPin={onPin}
          onArchive={onArchive}
          onUnarchive={onUnarchive}
          onDelete={onDelete}
        />
      )}
      {activeView === 'calls' && <CallsList />}
      {activeView === 'stories' && <StoriesList />}
      {activeView === 'settings' && <Settings onShowProfile={onShowProfile} />}
    </>
  );
}
