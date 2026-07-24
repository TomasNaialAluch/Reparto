import { mundialFabTheme } from './mundial/mundialFabTheme';
import { bocaFabTheme } from './boca/bocaFabTheme';

/**
 * Registro de temas FAB. Agregá acá cada motivo nuevo.
 */
export const FAB_THEMES = {
  mundial: mundialFabTheme,
  boca: bocaFabTheme,
};

/** Cambiá este id para activar otro tema sin tocar FabGeneral */
export const ACTIVE_FAB_THEME_ID = 'boca';

export const activeFabTheme = FAB_THEMES[ACTIVE_FAB_THEME_ID];
