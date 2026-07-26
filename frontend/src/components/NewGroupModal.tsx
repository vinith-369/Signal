'use client';
import { useState } from 'react';
import { Contact } from '@/lib/types';
import Avatar from './Avatar';

interface NewGroupModalProps {
  contacts: Contact[];
  onClose: () => void;
  onCreate: (name: string, memberIds: string[]) => void;
}

export default function NewGroupModal({ contacts, onClose, onCreate }: NewGroupModalProps) {
  const [groupName, setGroupName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredContacts = contacts.filter(c => 
    c.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleContact = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleCreate = () => {
    if (groupName.trim() && selectedIds.length > 0) {
      onCreate(groupName, selectedIds);
    }
  };

  return (
    <div className="new-group-panel">
      <div className="new-chat-header">
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginLeft: 16 }}>New group</h2>
      </div>
      
      <div style={{ padding: '16px' }}>
        <input 
          type="text" 
          placeholder="Group name" 
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          style={{ width: '100%', padding: '10px 0', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '16px', outline: 'none', marginBottom: 16 }}
        />
        
        {selectedIds.length > 0 && (
          <div className="member-chips-container">
            {selectedIds.map(id => {
              const contact = contacts.find(c => c.id === id);
              return (
                <div key={id} className="member-chip">
                  <Avatar name={contact?.display_name || contact?.username || 'U'} color={contact?.avatar_color || '#7C3AED'} size="sm" imageUrl={contact?.avatar_url} />
                  <span style={{ margin: '0 8px' }}>{contact?.display_name || contact?.username}</span>
                  <button onClick={() => toggleContact(id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: 2 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
        
        <div className="search-bar" style={{ display: 'flex', alignItems: 'center', background: 'var(--search-bg)', padding: '6px 12px', borderRadius: 8, marginBottom: 16 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            placeholder="Search contacts" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', marginLeft: 8, outline: 'none', width: '100%' }}
          />
        </div>
      </div>
      
      <div style={{ overflowY: 'auto', flex: 1 }}>
        <div style={{ padding: '8px 0' }}>
          {filteredContacts.map(contact => (
            <div key={contact.id} style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', cursor: 'pointer', transition: 'background-color 0.2s', width: '100%' }} onClick={() => toggleContact(contact.id)} onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--chat-item-hover)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: selectedIds.includes(contact.id) ? 'var(--msg-sent)' : 'transparent', borderColor: selectedIds.includes(contact.id) ? 'var(--msg-sent)' : 'var(--border-color)' }}>
                {selectedIds.includes(contact.id) && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>}
              </div>
              <Avatar name={contact.display_name || contact.username} color={contact.avatar_color} size="md" imageUrl={contact.avatar_url} />
              <div style={{ marginLeft: 12 }}>
                <span style={{ fontWeight: 500 }}>{contact.display_name || contact.username}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div style={{ padding: 16, borderTop: '1px solid var(--border-color)' }}>
        <button 
          onClick={handleCreate}
          disabled={!groupName.trim() || selectedIds.length === 0}
          style={{ width: '100%', padding: '12px', background: (!groupName.trim() || selectedIds.length === 0) ? 'var(--chat-item-hover)' : 'var(--msg-sent)', color: (!groupName.trim() || selectedIds.length === 0) ? 'var(--text-secondary)' : '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: (!groupName.trim() || selectedIds.length === 0) ? 'not-allowed' : 'pointer', transition: '0.2s' }}
        >
          Create Group
        </button>
      </div>
    </div>
  );
}
