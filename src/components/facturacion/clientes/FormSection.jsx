export default function FormSection({ label, children }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
          {label}
        </span>
        <div style={{ flex: 1, height: '1px', background: '#f3f4f6' }} />
      </div>
      {children}
    </div>
  );
}
