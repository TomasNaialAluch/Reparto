import React from 'react';

export default function PlaceholderSection({ Icon, title, desc }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '45vh', textAlign: 'center' }}>
      <div style={{
        width: '72px', height: '72px', borderRadius: '18px',
        background: 'rgba(106,136,153,0.12)', color: '#6A8899',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '18px',
      }}>
        <Icon size={34} />
      </div>
      <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#212529', marginBottom: '6px' }}>
        {title}
      </div>
      <div style={{ fontSize: '0.88rem', color: '#6c757d', maxWidth: '380px' }}>
        {desc}
      </div>
    </div>
  );
}
