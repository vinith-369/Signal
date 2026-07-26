'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';

const COLORS = ['#7C3AED', '#4CAF50', '#E91E63', '#FF9800', '#00BCD4', '#F44336', '#D4C5A9', '#9E9E9E'];

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [avatarColor, setAvatarColor] = useState(COLORS[0]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({
        display_name: displayName,
        username,
        phone,
        password,
        avatar_color: avatarColor,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#2C6BED" strokeWidth="1.5" style={{ marginBottom: '16px' }}>
            <path d="M12 2L3 6v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6l-9-4zm0 2.18l7 3.12v4.7c0 4.67-3.13 9.02-7 10.13-3.87-1.11-7-5.46-7-10.13V7.3l7-3.12z"/>
          </svg>
          <h1 className="login-title">Signal</h1>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="text"
            placeholder="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="login-input"
            required
          />
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="login-input"
            required
          />
          <input
            type="tel"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="login-input"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
            required
          />

          <div>
            <label style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
              Avatar Color
            </label>
            <div className="color-picker">
              {COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  className={`color-option ${avatarColor === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setAvatarColor(color)}
                />
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading} className="login-btn">
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <Link href="/login" className="login-link">
          Already have an account?
        </Link>
      </div>
    </div>
  );
}
