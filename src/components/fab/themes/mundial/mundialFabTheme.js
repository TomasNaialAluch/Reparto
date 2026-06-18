import MundialFabPanel from './MundialFabPanel';

/**
 * Tema activo del FAB General — Copa del Mundo FIFA 2026.
 * Para otro motivo (Navidad, Día del padre, etc.) creá una carpeta en themes/
 * con la misma forma y cambiá ACTIVE_FAB_THEME_ID en themes/index.js.
 */
export const mundialFabTheme = {
  id: 'mundial',
  ariaLabel: 'Mundial FIFA 2026',

  modal: {
    eyebrow: 'Copa del Mundo',
    title: 'FIFA 2026',
    titleId: 'fab-mundial-modal-title',
  },

  trigger: {
    accentColor: '#6A8899',
    iconSrc: '/ball.png',
    iconSize: 44,
  },

  physics: {
    autoKickMinMs: 14_000,
    autoKickMaxMs: 22_000,
    autoKickPower: 0.85,
    clickKickPower: 1.35,
  },

  Panel: MundialFabPanel,

  footer: {
    label: '¡Vamos Argentina!',
    background: '#6A8899',
  },
};
