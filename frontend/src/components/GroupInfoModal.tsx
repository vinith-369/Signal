'use client';
import { useState } from 'react';
import { Conversation, User } from '@/lib/types';
import Avatar from './Avatar';

interface GroupInfoModalProps {
  conversation: Conversation;
  currentUser: User;
  onClose: () => void;
  onAddMember: (username: string) => void;
  onRemoveMember: (userId: string) => void;
  onUpdateGroupName: (name: string) => void;
}

export default function GroupInfoModal({ conversation, currentUser, onClose, onAddMember, onRemoveMember, onUpdateGroupName }: GroupInfoModalProps) {
  const [newMemberUsername, setNewMemberUsername] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [groupName, setGroupName] = useState(conversation.name || '');

  const handleAdd = () => {
    if (newMemberUsername.trim()) {
      onAddMember(newMemberUsername.trim());
      setNewMemberUsername('');
    }
  };

  const handleSaveName = () => {
    if (groupName.trim() && groupName !== conversation.name) {
      onUpdateGroupName(groupName.trim());
    }
    setEditingName(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ width: 400, padding: 0 }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>Group Info</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            ✕
          </button>
        </div>
        
        <div style={{ padding: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
            <Avatar name={conversation.name || 'Group'} color="#2C6BED" size="xl" isGroup />
            
            {editingName ? (
              <div style={{ display: 'flex', marginTop: 16, gap: 8 }}>
                <input 
                  type="text" 
                  value={groupName} 
                  onChange={e => setGroupName(e.target.value)}
                  className="modal-input"
                  autoFocus
                />
                <button className="modal-btn modal-btn-primary" onClick={handleSaveName}>Save</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', marginTop: 16, gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: 24 }}>{conversation.name || 'Group Chat'}</h3>
                <button onClick={() => setEditingName(true)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>✏️</button>
              </div>
            )}
            <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0 0' }}>{conversation.members?.length || 0} members</p>
          </div>

          <div style={{ marginBottom: 24 }}>
            <h4 style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: 12, marginBottom: 12 }}>Add Member</h4>
            <div style={{ display: 'flex', gap: 8 }}>
              <input 
                type="text"
                placeholder="Username to add"
                value={newMemberUsername}
                onChange={e => setNewMemberUsername(e.target.value)}
                className="modal-input"
              />
              <button className="modal-btn modal-btn-primary" onClick={handleAdd}>Add</button>
            </div>
          </div>

          <div>
            <h4 style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: 12, marginBottom: 12 }}>Members</h4>
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {conversation.members?.map(member => (
                <div key={member.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar name={member.display_name || member.username} color={member.avatar_color} size="sm" />
                    <div>
                      <div style={{ fontWeight: 500 }}>{member.display_name || member.username} {member.id === currentUser.id && '(You)'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>@{member.username}</div>
                    </div>
                  </div>
                  {member.id !== currentUser.id && (
                    <button 
                      onClick={() => onRemoveMember(member.id)}
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 12, padding: '4px 8px' }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
