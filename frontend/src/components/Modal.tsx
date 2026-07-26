'use client';
import React, { useEffect, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children, actions }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div className="modal-content" ref={modalRef} role="dialog" aria-modal="true">
        <h2 className="modal-title">{title}</h2>
        <div className="modal-body">
          {children}
        </div>
        {actions && (
          <div className="modal-actions">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
