'use client';

export default function StoriesList() {
  return (
    <>
      <div className="sidebar-header">
        <h2 className="sidebar-header-title">Stories</h2>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', textAlign: 'center', padding: '32px 16px' }}>
        <p style={{ fontSize: '14px', maxWidth: '250px', margin: '0 auto', lineHeight: '1.5' }}>
          No recent updates from your contacts
        </p>
      </div>
    </>
  );
}
