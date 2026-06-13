import { useEffect } from 'react';

export default function ConfirmModal({
  isOpen, onClose, onConfirm,
  title, message,
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  confirmButtonClass = 'btn-danger'
}) {
  useEffect(() => {
    const handleEscape = (e) => { if (e.key === 'Escape' && isOpen) onClose(); };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isDanger = confirmButtonClass.includes('danger');
  const confirmBg    = isDanger ? '#dc3545' : '#A9D6E5';
  const confirmColor = isDanger ? 'white'   : '#1a3a45';

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)', zIndex: 1060 }} />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(420px, 92vw)',
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 24px 48px rgba(0,0,0,0.18)',
        zIndex: 1061,
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 22px 12px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
              Confirmar acción
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#212529' }}>{title}</div>
          </div>
          <button onClick={onClose}
            style={{ border: 'none', background: '#f3f4f6', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', color: '#6c757d' }}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 22px', fontSize: '0.875rem', color: '#495057', lineHeight: 1.55 }}>
          {message}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 22px 18px', display: 'flex', gap: '10px' }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #dee2e6', background: 'transparent', color: '#6c757d', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
            {cancelText}
          </button>
          <button onClick={() => { onConfirm(); onClose(); }} autoFocus
            style={{ flex: 2, padding: '10px', borderRadius: '10px', border: 'none', background: confirmBg, color: confirmColor, fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.15s' }}>
            {confirmText}
          </button>
        </div>
      </div>
    </>
  );
}
