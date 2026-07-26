'use client';

export default function CallsList() {
  const staticCalls = [
    { id: 1, name: 'Alice', time: 'Yesterday, 10:30 AM', type: 'incoming', missed: false },
    { id: 2, name: 'Bob', time: 'Yesterday, 9:15 AM', type: 'outgoing', missed: false },
    { id: 3, name: 'Charlie', time: 'Monday, 2:45 PM', type: 'incoming', missed: true },
  ];

  return (
    <>
      <div className="sidebar-header">
        <h2 className="sidebar-header-title">Calls</h2>
        <div className="sidebar-header-actions">
          <button className="icon-rail-btn" style={{ padding: 8, background: 'transparent' }}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              <line x1="12" y1="2" x2="12" y2="10"></line>
              <line x1="8" y1="6" x2="16" y2="6"></line>
            </svg>
          </button>
        </div>
      </div>
      
      <div className="chat-list" style={{ display: 'flex', flexDirection: 'column' }}>
        {staticCalls.map(call => (
          <div key={call.id} className="chat-list-item">
            <div className="avatar avatar-md" style={{ backgroundColor: '#7C3AED' }}>
              <span className="avatar-initials">{call.name.charAt(0)}</span>
            </div>
            
            <div className="chat-list-item-info">
              <span className="chat-list-item-name" style={{ color: call.missed ? 'var(--danger-red)' : 'var(--text-primary)' }}>
                {call.name}
              </span>
              <span className="chat-list-item-preview" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {call.type === 'incoming' ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 20 9 20 9 9"></polyline>
                    <line x1="20" y1="4" x2="9" y2="15"></line>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="4 4 15 4 15 15"></polyline>
                    <line x1="4" y1="20" x2="15" y2="9"></line>
                  </svg>
                )}
                {call.time}
              </span>
            </div>
            
            <div style={{ padding: '0 8px', color: 'var(--text-secondary)' }}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
            </div>
          </div>
        ))}

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', color: 'var(--text-secondary)', textAlign: 'center', flex: 1 }}>
          <p style={{ fontSize: '14px', maxWidth: '250px', margin: '0 auto', lineHeight: '1.5' }}>
            Your recent calls will appear here.
          </p>
        </div>
      </div>
    </>
  );
}
