import BocaFabPanel from './BocaFabPanel';
import { initBocaCache } from './bocaCache';

/**
 * Tema del FAB General — Boca Juniors (Liga Profesional Argentina, vía ESPN).
 * Para otro motivo creá una carpeta en themes/ con la misma forma y cambiá
 * ACTIVE_FAB_THEME_ID en themes/index.js.
 */
export const bocaFabTheme = {
  id: 'boca',
  ariaLabel: 'Boca Juniors',

  modal: {
    eyebrow: 'Liga Profesional',
    title: 'Boca Juniors',
    titleId: 'fab-boca-modal-title',
  },

  trigger: {
    accentColor: '#0b3d8c',
    iconSrc: 'https://a.espncdn.com/i/teamlogos/soccer/500/5.png',
    iconSize: 40,
  },

  physics: {
    autoKickMinMs: 14_000,
    autoKickMaxMs: 22_000,
    autoKickPower: 0.85,
    clickKickPower: 1.35,
  },

  Panel: BocaFabPanel,
  initCache: initBocaCache,

  footer: {
    label: '¡Vamos Boca!',
    background: '#0b3d8c',
  },
};
