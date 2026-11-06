// Estilos compartidos de la sección Pedidos (mismos tokens que la página Hoy).

export const chip = (activo = false) => ({
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '6px 14px', borderRadius: 999, fontSize: '0.85rem', fontWeight: 600,
  border: '1px solid var(--color-primary-border)',
  background: activo ? 'var(--color-primary)' : 'var(--color-primary-soft)',
  color: activo ? '#fff' : '#3a5060',
  cursor: 'pointer', transition: 'background .15s, transform .15s',
});

export const tarjeta = {
  background: '#fff',
  border: '1px solid var(--color-primary-border)',
  borderRadius: 12,
  padding: '10px 12px',
};

export const input = {
  padding: '6px 10px', borderRadius: 8, fontSize: '0.9rem', outline: 'none',
  border: '1px solid var(--color-primary-border)', background: '#fff',
};

export const etiqueta = (fondo, color) => ({
  display: 'inline-block', padding: '2px 8px', borderRadius: 999,
  fontSize: '0.72rem', fontWeight: 700, background: fondo, color,
});

export const ETIQUETAS = {
  ok: etiqueta('#dcfce7', '#166534'),
  aviso: etiqueta('#fef3c7', '#92400e'),
  error: etiqueta('#fee2e2', '#991b1b'),
  neutra: etiqueta('#e5e7eb', '#4b5563'),
};

export const aviso = {
  background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e',
  borderRadius: 12, padding: '10px 14px', fontSize: '0.88rem',
};
