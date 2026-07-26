'use client';

import { Conversation, User } from '@/lib/types';
import Avatar from './Avatar';

interface ProfileCardProps {
  conversation: Conversation;
  currentUser: User;
}

export default function ProfileCard({ conversation, currentUser }: ProfileCardProps) {
  const isGroup = conversation.type === 'group';

  if (isGroup) {
    const memberNames = conversation.members?.map(m => m.display_name || m.username) || [];
    const displayNames = memberNames.length > 2 
      ? `${memberNames[0]}, ${memberNames[1]}, and you` 
      : memberNames.join(', ');

    return (
      <div className="profile-card">
        <Avatar name={conversation.name || 'Group'} color="#2C6BED" size="xl" isGroup={true} />
        <h2 className="profile-card-name">{conversation.name || 'Group Chat'}</h2>
        <p className="profile-card-info">{displayNames}</p>
      </div>
    );
  }

  const otherMember = conversation.members?.find(m => m.id !== currentUser.id);
  const name = otherMember?.display_name || otherMember?.username || 'Unknown';
  const color = otherMember?.avatar_color || '#7C3AED';
  const avatarUrl = otherMember?.avatar_url || undefined;
  
  return (
    <div className="profile-card">
      <Avatar name={name} color={color} size="xl" imageUrl={avatarUrl} />
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', marginTop: 16 }}>
        <h2 className="profile-card-name">{name}</h2>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>
      
      <div className="profile-card-badge">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 4 }}>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
        Name not verified
      </div>
      
      <p className="profile-card-info" style={{ marginTop: 8 }}>No groups in common</p>
    </div>
  );
}
