import React from 'react';

export default function Breadcrumb({ items, onNavigate }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px', fontSize: '0.8rem', flexWrap: 'wrap' }}>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <React.Fragment key={i}>
            {i > 0 && <span style={{ color: '#ced4da' }}>/</span>}
            {isLast ? (
              <span style={{ fontWeight: 700, color: '#212529' }}>{item.label}</span>
            ) : (
              <button
                onClick={() => onNavigate(item)}
                style={{ border: 'none', background: 'transparent', color: '#6A8899', fontWeight: 600, cursor: 'pointer', padding: 0, fontSize: 'inherit' }}
              >
                {item.label}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
