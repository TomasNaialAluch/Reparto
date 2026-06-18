import React from 'react';
import { FAB_TRIGGER_SIZE, FAB_Z_INDEX } from './constants';

/**
 * Botón flotante del FAB. La posición la controla useFabPhysics vía transform.
 */
const FabTriggerButton = ({
  ballRef,
  ariaLabel,
  kickFlash,
  stored = false,
  accentColor = '#6A8899',
  triggerBackground = 'white',
  iconColor = '#3a5060',
  children,
  onClick,
}) => (
  <button
    ref={ballRef}
    type="button"
    aria-label={ariaLabel}
    onClick={onClick}
    className="fab-general-trigger"
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: FAB_Z_INDEX.trigger,
      width: FAB_TRIGGER_SIZE,
      height: FAB_TRIGGER_SIZE,
      borderRadius: '50%',
      border: kickFlash
        ? '2px solid white'
        : triggerBackground !== 'white'
          ? `1px solid ${accentColor}`
          : '1px solid #d3d9de',
      background: triggerBackground,
      boxShadow: kickFlash
        ? `0 6px 20px ${accentColor}99`
        : triggerBackground !== 'white'
          ? `0 4px 14px ${accentColor}66`
          : '0 4px 14px rgba(0,0,0,0.12)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: iconColor,
      cursor: stored ? 'default' : 'pointer',
      padding: 0,
      transition: 'box-shadow 0.15s, border-color 0.15s',
      touchAction: 'none',
      willChange: 'transform',
      pointerEvents: stored ? 'none' : 'auto',
    }}
  >
    {children}
  </button>
);

export default FabTriggerButton;
