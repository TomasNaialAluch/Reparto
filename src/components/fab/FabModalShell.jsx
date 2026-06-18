import React from 'react';
import { IconX } from '../gestionSemanal/icons';
import { FAB_Z_INDEX } from './constants';

/**
 * Marco modal NEWLOOK reutilizable para cualquier tema FAB.
 */
const FabModalShell = ({
  eyebrow,
  title,
  titleId,
  accentColor = '#6A8899',
  onClose,
  children,
  footer,
}) => (
  <>
    <div
      onClick={onClose}
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: FAB_Z_INDEX.overlay,
        background: 'rgba(0,0,0,0.35)',
        backdropFilter: 'blur(3px)',
      }}
    />
    <div
      role="dialog"
      aria-labelledby={titleId}
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: FAB_Z_INDEX.modal,
        width: 'min(440px, 92vw)',
        maxHeight: '85vh',
        background: 'white',
        borderRadius: '16px',
        border: '1px solid #d3d9de',
        boxShadow: '0 24px 48px rgba(0,0,0,0.18)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '16px 18px 12px',
          borderBottom: '1px solid #dde2e6',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div>
          {eyebrow && (
            <div
              style={{
                fontSize: '0.65rem',
                fontWeight: 600,
                color: '#6c757d',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '4px',
              }}
            >
              {eyebrow}
            </div>
          )}
          <h2
            id={titleId}
            style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#212529' }}
          >
            {title}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="d-inline-flex align-items-center justify-content-center"
          style={{
            border: 'none',
            background: '#e9ecef',
            borderRadius: '50%',
            width: 32,
            height: 32,
            cursor: 'pointer',
            color: '#6c757d',
            flexShrink: 0,
          }}
        >
          <IconX size={14} />
        </button>
      </div>

      <div style={{ padding: '16px 18px', overflowY: 'auto', flex: 1 }}>{children}</div>

      {footer && (
        <div style={{ padding: '12px 18px', borderTop: '1px solid #dde2e6' }}>{footer}</div>
      )}
    </div>
  </>
);

export default FabModalShell;
