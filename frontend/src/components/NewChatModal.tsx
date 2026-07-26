'use client';
import { useState, useEffect } from 'react';
import { Contact, User } from '@/lib/types';
import { api } from '@/lib/api';
import Avatar from './Avatar';

interface NewChatModalProps {
  contacts: Contact[];
  onClose: () => void;
  onSelectContact: (contactId: string) => void;
  onNewGroup: () => void;
  onAddContact: (username: string) => void;
}

export default function NewChatModal({ contacts, onClose, onSelectContact, onNewGroup, onAddContact }: NewChatModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  
  const filteredContacts = contacts.filter(c => 
    c.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (searchTerm.length >= 2) {
      api.searchUsers(searchTerm).then(res => {
        // Filter out those who are already in contacts
        const existingIds = new Set(contacts.map(c => c.id));
        setSearchResults(res.filter((u: User) => !existingIds.has(u.id)));
      }).catch(console.error);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, contacts]);

  return (
    <div className="new-chat-panel">
      <div className="new-chat-header">
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginLeft: 16 }}>New chat</h2>
      </div>
      
      <div style={{ padding: '0 16px 12px' }}>
        <div className="search-bar" style={{ display: 'flex', alignItems: 'center', background: 'var(--search-bg)', padding: '6px 12px', borderRadius: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            placeholder="Name, username, or number" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', marginLeft: 8, outline: 'none', width: '100%' }}
          />
        </div>
      </div>
      
      <div style={{ overflowY: 'auto', flex: 1 }}>
        <div className="new-chat-option" onClick={onNewGroup}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: 'var(--chat-item-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <span>New group</span>
        </div>
        
        {searchTerm && (
          <div className="new-chat-option" onClick={() => onAddContact(searchTerm)}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: 'var(--chat-item-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2">
                <circle cx="12" cy="12" r="4"></circle>
                <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"></path>
              </svg>
            </div>
            <span>Find by username</span>
          </div>
        )}

        {searchResults.length > 0 && (
          <>
            <div className="new-chat-contacts-label">Global Search</div>
            <div className="chat-list">
              {searchResults.map(user => (
                <div key={user.id} className="new-chat-contact-item" onClick={() => onAddContact(user.username)}>
                  <Avatar name={user.display_name || user.username} color={user.avatar_color} size="md" imageUrl={user.avatar_url} />
                  <div style={{ marginLeft: 12, display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 500 }}>{user.display_name || user.username}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>@{user.username}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="new-chat-contacts-label">Contacts</div>
        
        <div className="chat-list">
          {filteredContacts.map(contact => (
            <div key={contact.id} className="new-chat-contact-item" onClick={() => onSelectContact(contact.id)}>
              <Avatar name={contact.display_name || contact.username} color={contact.avatar_color} size="md" imageUrl={contact.avatar_url} />
              <div style={{ marginLeft: 12, display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 500 }}>{contact.display_name || contact.username}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
