'use client';
import { useState, useMemo } from 'react';
import { Conversation, User } from '@/lib/types';
import ChatListItem from './ChatListItem';

interface ChatListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (conv: Conversation) => void;
  onNewChat: () => void;
  user: User;
  onPin?: (id: string) => void;
  onArchive?: (id: string) => void;
  onUnarchive?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function ChatList({ conversations, selectedId, onSelect, onNewChat, user, onPin, onArchive, onUnarchive, onDelete }: ChatListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const filteredConversations = useMemo(() => {
    let filtered = conversations;
    if (!showArchived) {
      filtered = filtered.filter(c => !c.is_archived);
    } else {
      filtered = filtered.filter(c => c.is_archived);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(conv => {
        const name = conv.type === 'group' ? conv.name : conv.members.find(m => m.id !== user.id)?.display_name || '';
        const lastMsg = conv.last_message?.content || '';
        return (name?.toLowerCase().includes(term) || lastMsg.toLowerCase().includes(term));
      });
    }
    return filtered.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }, [conversations, searchTerm, user.id]);

  const pinned = filteredConversations.filter(c => c.is_pinned);
  const archivedCount = conversations.filter(c => c.is_archived).length;
  const regular = filteredConversations.filter(c => !c.is_pinned);

  return (
    <>
      <div className="sidebar-header">
        <h2 className="sidebar-header-title">Chats</h2>
        <div className="sidebar-header-actions">
          <button onClick={onNewChat} className="icon-rail-btn" style={{ padding: 8, background: 'transparent' }}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
        </div>
      </div>
      
      <div style={{ padding: '0 16px 12px' }}>
        <div className="search-bar" style={{ display: 'flex', alignItems: 'center', background: 'var(--search-bg)', padding: '6px 12px', borderRadius: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            placeholder="Search" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', marginLeft: 8, outline: 'none', width: '100%' }}
          />
        </div>
      </div>

      <div className="chat-list">
        {showArchived && (
          <div className="archived-header" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => setShowArchived(false)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }}>
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Archived Chats
          </div>
        )}
        
        {showArchived ? (
          <div>
            {filteredConversations.map(conv => (
              <ChatListItem 
                key={conv.id} 
                conversation={conv} 
                isSelected={conv.id === selectedId} 
                onClick={() => onSelect(conv)} 
                currentUserId={user.id} 
                onPin={() => onPin?.(conv.id)}
                onArchive={() => onArchive?.(conv.id)}
                onUnarchive={() => onUnarchive?.(conv.id)}
                onDelete={() => onDelete?.(conv.id)}
              />
            ))}
          </div>
        ) : (
          <>
            {pinned.length > 0 && (
              <div>
                <div className="section-label">Pinned</div>
                {pinned.map(conv => (
                  <ChatListItem 
                    key={conv.id} 
                    conversation={conv} 
                    isSelected={conv.id === selectedId} 
                    onClick={() => onSelect(conv)} 
                    currentUserId={user.id} 
                    onPin={() => onPin?.(conv.id)}
                    onArchive={() => onArchive?.(conv.id)}
                    onUnarchive={() => onUnarchive?.(conv.id)}
                    onDelete={() => onDelete?.(conv.id)}
                  />
                ))}
              </div>
            )}
            
            {regular.length > 0 && (
              <div>
                {pinned.length > 0 && <div className="section-label">Chats</div>}
                {regular.map(conv => (
                  <ChatListItem 
                    key={conv.id} 
                    conversation={conv} 
                    isSelected={conv.id === selectedId} 
                    onClick={() => onSelect(conv)} 
                    currentUserId={user.id} 
                    onPin={() => onPin?.(conv.id)}
                    onArchive={() => onArchive?.(conv.id)}
                    onUnarchive={() => onUnarchive?.(conv.id)}
                    onDelete={() => onDelete?.(conv.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {archivedCount > 0 && !showArchived && (
          <div className="archived-link" style={{ padding: 16, textAlign: 'center', color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={() => setShowArchived(true)}>
            Archived Chats ({archivedCount})
          </div>
        )}
      </div>
    </>
  );
}
