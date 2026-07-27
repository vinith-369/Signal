'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { WebSocketClient } from '@/lib/websocket';
import { api } from '@/lib/api';
import { Conversation, Message, Contact, SidebarView } from '@/lib/types';
import IconRail from '@/components/IconRail';
import Sidebar from '@/components/Sidebar';
import ChatPane from '@/components/ChatPane';
import NewChatModal from '@/components/NewChatModal';
import NewGroupModal from '@/components/NewGroupModal';
import SettingsProfile from '@/components/SettingsProfile';
import GroupInfoModal from '@/components/GroupInfoModal';

export default function ChatPage() {
  const { user, isAuthenticated, isLoading, token, updateProfile, logout } = useAuth();
  const router = useRouter();

  const [activeView, setActiveView] = useState<SidebarView>('chats');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [hasMoreMsgs, setHasMoreMsgs] = useState(true);
  const [wsClient, setWsClient] = useState<WebSocketClient | null>(null);
  const selectedConvRef = useRef<Conversation | null>(null);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    selectedConvRef.current = selectedConversation;
  }, [selectedConversation]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated || !user || !token) return;

    const ws = new WebSocketClient(user.id, token);

    ws.onMessage = (data: any) => {
      const msg = data.message;
      if (!msg) return;

      const currentConv = selectedConvRef.current;
      if (currentConv && currentConv.id === msg.conversation_id) {
        setMessages(prev => [...prev, msg]);
      }

      setConversations(prev => {
        const idx = prev.findIndex(c => c.id === msg.conversation_id);
        if (idx === -1) {
          setTimeout(() => {
            api.getConversations().then(setConversations).catch(console.error);
          }, 0);
          return prev;
        }
        const updatedConv = { ...prev[idx], last_message: msg, updated_at: msg.created_at };
        if (!currentConv || currentConv.id !== msg.conversation_id) {
          updatedConv.unread_count = (updatedConv.unread_count || 0) + 1;
        }
        return [updatedConv, ...prev.slice(0, idx), ...prev.slice(idx + 1)];
      });
    };

    ws.onTyping = (data: any) => {
      if (data.conversation_id === selectedConvRef.current?.id) {
        setTypingUsers(prev => ({
          ...prev,
          [data.user_id]: data.is_typing
        }));
      }
    };

    ws.onRead = (data: any) => {
      setMessages(prev =>
        prev.map(m => m.id === data.message_id ? { ...m, status: 'read' as const } : m)
      );
    };

    ws.onMessageUpdate = (data: any) => {
      setMessages(prev =>
        prev.map(m => m.id === data.message_id ? { ...m, status: data.status } : m)
      );
      setConversations(prev => {
        const idx = prev.findIndex(c => c.id === data.conversation_id);
        if (idx === -1) return prev;
        const c = prev[idx];
        if (c.last_message?.id === data.message_id) {
          const updated = { ...c, last_message: { ...(c.last_message as Message), status: data.status } };
          return [...prev.slice(0, idx), updated, ...prev.slice(idx + 1)];
        }
        return prev;
      });
    };

    ws.onMessageDeleted = (data: any) => {
      setMessages(prev => prev.filter(m => m.id !== data.message_id));
    };

    ws.onMessagesRead = (data: any) => {
      const readIds = new Set(data.message_ids || []);
      setMessages(prev =>
        prev.map(m => readIds.has(m.id) ? { ...m, status: 'read' as const } : m)
      );
      // Also update the last_message status in the sidebar
      setConversations(prev => {
        const idx = prev.findIndex(c => c.id === data.conversation_id);
        if (idx === -1) return prev;
        const c = prev[idx];
        if (c.last_message && readIds.has(c.last_message.id)) {
          const updated = { ...c, last_message: { ...(c.last_message as Message), status: 'read' as const } };
          return [...prev.slice(0, idx), updated, ...prev.slice(idx + 1)];
        }
        return prev;
      });
    };

    setWsClient(ws);

    api.getConversations().then(setConversations).catch(console.error);
    api.getContacts().then(setContacts).catch(console.error);

    return () => {
      ws.disconnect();
    };
  }, [isAuthenticated, user, token]);

  const handleSelectConversation = useCallback(async (conv: Conversation) => {
    setSelectedConversation(conv);
    setShowNewChat(false);
    setShowNewGroup(false);
    setHasMoreMsgs(true);
    try {
      const msgs = await api.getMessages(conv.id);
      setMessages(msgs);
      if (msgs.length < 50) setHasMoreMsgs(false);
      if (msgs.length > 0) {
        await api.markRead(msgs[msgs.length - 1].id);
      }
      setConversations(prev =>
        prev.map(c => c.id === conv.id ? { ...c, unread_count: 0 } : c)
      );
    } catch (err) {
      console.error(err);
    }
  }, []);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!selectedConversation) return;
    try {
      const msg = await api.sendMessage(selectedConversation.id, content);
      setMessages(prev => [...prev, msg]);
      setConversations(prev => {
        const idx = prev.findIndex(c => c.id === selectedConversation.id);
        if (idx === -1) return prev;
        const updated = { ...prev[idx], last_message: msg, updated_at: msg.created_at };
        return [updated, ...prev.slice(0, idx), ...prev.slice(idx + 1)];
      });
    } catch (err) {
      console.error(err);
    }
  }, [selectedConversation]);

  const handleNewContact = useCallback(async (contactId: string) => {
    try {
      const conv = await api.createConversation('direct', [contactId]);
      setConversations(prev => {
        const existing = prev.find(c => c.id === conv.id);
        if (existing) return prev;
        return [conv, ...prev];
      });
      setSelectedConversation(conv);
      setShowNewChat(false);
      const msgs = await api.getMessages(conv.id);
      setMessages(msgs);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const handleCreateGroup = useCallback(async (name: string, memberIds: string[]) => {
    try {
      const conv = await api.createGroup(name, memberIds);
      setConversations(prev => [conv, ...prev]);
      setSelectedConversation(conv);
      setShowNewGroup(false);
      setShowNewChat(false);
      setMessages([]);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const handleAddContact = useCallback(async (username: string) => {
    try {
      await api.addContact(username);
      const updatedContacts = await api.getContacts();
      setContacts(updatedContacts);
      
      const newContact = updatedContacts.find((c: Contact) => c.username.toLowerCase() === username.toLowerCase());
      if (newContact) {
        handleNewContact(newContact.id);
      }
    } catch (err) {
      console.error(err);
    }
  }, [handleNewContact]);

  const handlePinConversation = useCallback(async (convId: string) => {
    try {
      const conv = conversations.find(c => c.id === convId);
      if (!conv) return;
      await api.updateConversation(convId, { is_pinned: conv.is_pinned ? 0 : 1 });
      setConversations(prev =>
        prev.map(c => c.id === convId ? { ...c, is_pinned: !c.is_pinned } : c)
      );
    } catch (err) { console.error(err); }
  }, [conversations]);

  const handleArchiveConversation = useCallback(async (convId: string) => {
    try {
      await api.updateConversation(convId, { is_archived: 1 });
      setConversations(prev =>
        prev.map(c => c.id === convId ? { ...c, is_archived: true } : c)
      );
      if (selectedConversation?.id === convId) setSelectedConversation(null);
    } catch (err) { console.error(err); }
  }, [selectedConversation]);

  const handleUnarchiveConversation = useCallback(async (convId: string) => {
    try {
      await api.updateConversation(convId, { is_archived: 0 });
      setConversations(prev =>
        prev.map(c => c.id === convId ? { ...c, is_archived: false } : c)
      );
    } catch (err) { console.error(err); }
  }, []);

  const handleDeleteConversation = useCallback(async (convId: string) => {
    try {
      await api.deleteConversation(convId);
      setConversations(prev => prev.filter(c => c.id !== convId));
      if (selectedConversation?.id === convId) {
        setSelectedConversation(null);
        setMessages([]);
      }
    } catch (err) { console.error(err); }
  }, [selectedConversation]);

  const handleDeleteMessage = useCallback(async (msgId: string) => {
    try {
      await api.deleteMessage(msgId);
      setMessages(prev => prev.filter(m => m.id !== msgId));
    } catch (err) { console.error(err); }
  }, []);

  const handleLoadMore = useCallback(async () => {
    if (!selectedConversation || messages.length === 0 || loadingMoreRef.current || !hasMoreMsgs) return;
    try {
      loadingMoreRef.current = true;
      const older = await api.getMessages(selectedConversation.id, 50, messages[0].created_at);
      if (older.length < 50) {
        setHasMoreMsgs(false);
      }
      if (older.length > 0) {
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const uniqueOlder = older.filter((m: Message) => !existingIds.has(m.id));
          return [...uniqueOlder, ...prev];
        });
      }
    } catch (err) { console.error(err); } finally {
      loadingMoreRef.current = false;
    }
  }, [selectedConversation, messages]);

  const refreshConversations = useCallback(async () => {
    try {
      const convs = await api.getConversations();
      setConversations(convs);
    } catch (err) { console.error(err); }
  }, []);

  const handleAddGroupMember = useCallback(async (username: string) => {
    if (!selectedConversation) return;
    try {
      await api.addGroupMember(selectedConversation.id, username);
      const updated = await api.getConversation(selectedConversation.id);
      setSelectedConversation(updated);
      refreshConversations();
    } catch (err) { console.error(err); alert('Failed to add member'); }
  }, [selectedConversation, refreshConversations]);

  const handleRemoveGroupMember = useCallback(async (userId: string) => {
    if (!selectedConversation) return;
    try {
      await api.removeGroupMember(selectedConversation.id, userId);
      const updated = await api.getConversation(selectedConversation.id);
      setSelectedConversation(updated);
      refreshConversations();
    } catch (err) { console.error(err); alert('Failed to remove member'); }
  }, [selectedConversation, refreshConversations]);

  const handleUpdateGroupName = useCallback(async (name: string) => {
    if (!selectedConversation) return;
    try {
      await api.updateGroup(selectedConversation.id, name);
      const updated = await api.getConversation(selectedConversation.id);
      setSelectedConversation(updated);
      refreshConversations();
    } catch (err) { console.error(err); alert('Failed to update group name'); }
  }, [selectedConversation, refreshConversations]);

  if (isLoading || !isAuthenticated || !user) return null;

  return (
    <div className="app-container">
      <IconRail activeView={activeView} onViewChange={setActiveView} />
      <div className="sidebar">
        {showNewChat ? (
          <NewChatModal
            contacts={contacts}
            onClose={() => setShowNewChat(false)}
            onSelectContact={handleNewContact}
            onNewGroup={() => { setShowNewChat(false); setShowNewGroup(true); }}
            onAddContact={handleAddContact}
          />
        ) : showNewGroup ? (
          <NewGroupModal
            contacts={contacts}
            onClose={() => setShowNewGroup(false)}
            onCreate={handleCreateGroup}
          />
        ) : (
          <Sidebar
            activeView={activeView}
            conversations={conversations}
            contacts={contacts}
            onSelectConversation={handleSelectConversation}
            selectedConversationId={selectedConversation?.id || null}
            onNewChat={() => setShowNewChat(true)}
            onRefresh={refreshConversations}
            onShowProfile={() => setShowProfile(true)}
            onPin={handlePinConversation}
            onArchive={handleArchiveConversation}
            onUnarchive={handleUnarchiveConversation}
            onDelete={handleDeleteConversation}
          />
        )}
      </div>
      <div className="chat-pane">
        {activeView === 'settings' && showProfile ? (
          <SettingsProfile user={user} onUpdateProfile={updateProfile} onLogout={logout} />
        ) : activeView === 'chats' && selectedConversation ? (
          <ChatPane
            conversation={selectedConversation}
            messages={messages}
            currentUser={user}
            typingUsers={typingUsers}
            onSendMessage={handleSendMessage}
            onLoadMore={handleLoadMore}
            wsClient={wsClient}
            onPin={() => handlePinConversation(selectedConversation.id)}
            onArchive={() => handleArchiveConversation(selectedConversation.id)}
            onDelete={() => handleDeleteConversation(selectedConversation.id)}
            onDeleteMessage={api.deleteMessage.bind(api)}
            onShowGroupInfo={() => setShowGroupInfo(true)}
          />
        ) : (
          <div className="chat-pane-empty">
            {activeView === 'chats' ? (
              <>
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3">
                  <path d="M12 2L3 6v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6l-9-4zm0 2.18l7 3.12v4.7c0 4.67-3.13 9.02-7 10.13-3.87-1.11-7-5.46-7-10.13V7.3l7-3.12z"/>
                </svg>
                <p>Select a chat to start messaging</p>
              </>
            ) : null}
          </div>
        )}
      </div>

      {showGroupInfo && selectedConversation && selectedConversation.type === 'group' && (
        <GroupInfoModal
          conversation={selectedConversation}
          currentUser={user}
          onClose={() => setShowGroupInfo(false)}
          onAddMember={handleAddGroupMember}
          onRemoveMember={handleRemoveGroupMember}
          onUpdateGroupName={handleUpdateGroupName}
        />
      )}
    </div>
  );
}
