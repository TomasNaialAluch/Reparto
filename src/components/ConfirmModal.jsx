import { useEffect } from 'react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Aceptar", cancelText = "Cancelar", confirmButtonClass = "btn-danger" }) {
  // Cerrar modal con tecla Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

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

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div 
      className="modal show d-block" 
      tabIndex="-1"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        animation: 'fadeIn 0.2s ease-in-out'
      }}
      onClick={onClose}
    >
      <div 
        className="modal-dialog modal-dialog-centered"
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className="modal-content"
          style={{
            animation: 'slideDown 0.3s ease-out',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
          }}
        >
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold">{title}</h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body pt-2">
            <p className="mb-0">{message}</p>
          </div>
          <div className="modal-footer border-0 pt-0">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={onClose}
            >
              {cancelText}
            </button>
            <button 
              type="button" 
              className={`btn ${confirmButtonClass}`}
              onClick={handleConfirm}
              autoFocus
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideDown {
          from {
            transform: translateY(-50px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

