'use client';
import React, { useEffect, useRef } from 'react';

export interface ContextMenuItem {
  label?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  danger?: boolean;
  separator?: boolean;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  position: { x: number; y: number } | null;
  onClose: () => void;
}

export default function ContextMenu({ items, position, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (position) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [position, onClose]);

  if (!position) return null;

  return (
    <div 
      className="context-menu" 
      ref={menuRef}
      style={{ 
        left: position.x, 
        top: position.y 
      }}
    >
      {items.map((item, index) => {
        if (item.separator) {
          return <div key={`sep-${index}`} className="context-menu-separator" />;
        }

        return (
          <div 
            key={index} 
            className={`context-menu-item ${item.danger ? 'danger' : ''}`}
            onClick={() => {
              if (item.onClick) item.onClick();
              onClose();
            }}
          >
            {item.icon && <span className="context-menu-icon">{item.icon}</span>}
            <span>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}
