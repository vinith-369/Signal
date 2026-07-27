'use client';
import { User } from '@/lib/types';
import { useState } from 'react';

interface SettingsProfileProps {
  user: User;
  onUpdateProfile: (data: Partial<User>) => void;
  onLogout: () => void;
}

export default function SettingsProfile({ user, onUpdateProfile, onLogout }: SettingsProfileProps) {
  const [displayName, setDisplayName] = useState(user.display_name || '');
  const [about, setAbout] = useState(user.about || '');

  return (
    <div className="settings-profile-pane">
      <div className="profile-pane-header">
        <h2>Profile</h2>
      </div>
      
      <div className="profile-pane-content">
        <div className="profile-avatar-xl">
          <div className="avatar-placeholder-xl">{displayName.charAt(0) || user.username.charAt(0) || 'U'}</div>
          <button className="edit-photo-btn">Edit photo</button>
        </div>
        
        <div className="profile-info-text">
          Your profile and changes to it will be visible to people you message, contacts and groups.
        </div>
        
        <div className="profile-field">
          <div className="field-icon">👤</div>
          <div className="field-input-wrapper">
            <input 
              type="text" 
              value={displayName} 
              onChange={(e) => setDisplayName(e.target.value)} 
              onBlur={() => onUpdateProfile({ display_name: displayName })}
              placeholder="Display name"
            />
          </div>
        </div>
        
        <div className="profile-field">
          <div className="field-icon">✏️</div>
          <div className="field-input-wrapper">
            <input 
              type="text" 
              value={about} 
              onChange={(e) => setAbout(e.target.value)} 
              onBlur={() => onUpdateProfile({ about })}
              placeholder="About"
            />
          </div>
        </div>
        
        <div className="profile-field">
          <div className="field-icon">@</div>
          <div className="field-input-wrapper">
            <input 
              type="text" 
              value={user.username} 
              disabled
              className="disabled-input"
            />
          </div>
        </div>

        <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center' }}>
          <button 
            className="modal-btn modal-btn-danger" 
            style={{ width: '100%', padding: '12px' }}
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
