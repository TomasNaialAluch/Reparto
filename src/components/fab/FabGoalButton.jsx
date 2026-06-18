import React from 'react';
import { FAB_GOAL, FAB_Z_INDEX } from './constants';

/**
 * FAB arco — guardar/soltar la pelota.
 */
const FabGoalButton = React.forwardRef(
  ({ accentColor = '#6A8899', onClick, disabled, ballStored = false }, ref) => (
  <button
    ref={ref}
    type="button"
    aria-label={ballStored ? 'Arco — soltar pelota' : 'Arco — guardar pelota'}
    disabled={disabled}
    onClick={onClick}
    className="fab-goal-trigger"
    style={{
      position: 'fixed',
      right: FAB_GOAL.right,
      bottom: FAB_GOAL.bottom,
      zIndex: FAB_Z_INDEX.goal,
      width: FAB_GOAL.width,
      height: FAB_GOAL.height,
      padding: '4px 6px 2px',
      border: `1px solid ${ballStored ? '#7cb88a' : accentColor}`,
      borderRadius: '8px 8px 4px 4px',
      background: ballStored
        ? 'linear-gradient(180deg, rgba(50,72,58,0.95) 0%, rgba(30,48,36,0.98) 100%)'
        : 'linear-gradient(180deg, rgba(42,58,68,0.92) 0%, rgba(26,36,44,0.95) 100%)',
      boxShadow: ballStored
        ? `0 4px 14px rgba(124,184,138,0.35)`
        : '0 4px 12px rgba(0,0,0,0.2)',
      cursor: disabled ? 'default' : 'pointer',
      opacity: disabled ? 0.55 : 1,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      transition: 'opacity 0.2s, transform 0.15s',
    }}
  >
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 56 42"
      fill="none"
      aria-hidden
      style={{ display: 'block' }}
    >
      <line x1="6" y1="38" x2="50" y2="38" stroke={accentColor} strokeWidth="2" strokeLinecap="round" />
      <path
        d="M10 38 V14 M46 38 V14 M10 14 H46"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 18 H42 M14 24 H42 M14 30 H42"
        stroke="rgba(255,255,255,0.28)"
        strokeWidth="1"
      />
      <path
        d="M16 18 V30 M22 18 V30 M28 18 V30 M34 18 V30 M40 18 V30"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="0.75"
      />
    </svg>
  </button>
  )
);

FabGoalButton.displayName = 'FabGoalButton';

export default FabGoalButton;
