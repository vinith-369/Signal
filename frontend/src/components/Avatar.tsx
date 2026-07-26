'use client';
import React from 'react';

interface AvatarProps {
  name: string;
  color: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  imageUrl?: string | null;
  isOnline?: boolean;
  isGroup?: boolean;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toLowerCase();
  return name.slice(0, 2).toLowerCase();
}

export default function Avatar({ name, color, size = 'md', imageUrl, isOnline, isGroup }: AvatarProps) {
  const sizeClass = `avatar-${size}`;
  return (
    <div className={`avatar ${sizeClass}`} style={{ backgroundColor: isGroup ? '#2C6BED' : color }}>
      {imageUrl ? (
        <img src={imageUrl} alt={name} className="avatar-img" />
      ) : isGroup ? (
        <svg className="avatar-group-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ) : (
        <span className="avatar-initials">{getInitials(name)}</span>
      )}
      {isOnline && <span className="avatar-online" />}
    </div>
  );
}
