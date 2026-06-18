import { mundialFabTheme } from './mundial/mundialFabTheme';

/**
 * Registro de temas FAB. Agregá acá cada motivo nuevo.
 */
export const FAB_THEMES = {
  mundial: mundialFabTheme,
};

/** Cambiá este id para activar otro tema sin tocar FabGeneral */
export const ACTIVE_FAB_THEME_ID = 'mundial';

export const activeFabTheme = FAB_THEMES[ACTIVE_FAB_THEME_ID];
