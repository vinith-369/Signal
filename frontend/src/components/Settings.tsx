'use client';
import { useAuth } from '@/lib/auth';

interface SettingsProps {
  onShowProfile?: () => void;
}

export default function Settings({ onShowProfile }: SettingsProps) {
  const { user } = useAuth();

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h2>Settings</h2>
      </div>
      
      {user && (
        <div className="settings-profile-card" onClick={onShowProfile}>
          <div className="avatar">{user.display_name?.charAt(0) || user.username.charAt(0)}</div>
          <div className="profile-info">
            <div className="profile-name">{user.display_name || user.username}</div>
            <div className="profile-phone">{user.phone || ''}</div>
          </div>
        </div>
      )}
      
      <div className="settings-menu">
        <div className="settings-menu-item">
          <span className="menu-icon">⚙️</span>
          <span>General</span>
        </div>
        <div className="settings-menu-item">
          <span className="menu-icon">🎨</span>
          <span>Appearance</span>
        </div>
        <div className="settings-menu-item">
          <span className="menu-icon">💬</span>
          <span>Chats</span>
        </div>
        <div className="settings-menu-item">
          <span className="menu-icon">📞</span>
          <span>Calls</span>
        </div>
        <div className="settings-menu-item">
          <span className="menu-icon">🔔</span>
          <span>Notifications</span>
        </div>
        <div className="settings-menu-item">
          <span className="menu-icon">🔒</span>
          <span>Privacy</span>
        </div>
        <div className="settings-menu-item">
          <span className="menu-icon">📊</span>
          <span>Data usage</span>
        </div>
        <div className="settings-menu-item">
          <span className="menu-icon">☁️</span>
          <span>Backups</span>
        </div>
        <div className="settings-menu-item">
          <span className="menu-icon">❤️</span>
          <span>Donate to Signal</span>
        </div>
      </div>
    </div>
  );
}
