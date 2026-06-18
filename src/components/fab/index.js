/**
 * Sistema FAB General
 *
 * Uso en App:
 *   import { FabGeneral } from './components/fab';
 *   <FabGeneral />
 *
 * Nuevo motivo:
 *   1. Crear carpeta en themes/miMotivo/
 *   2. Exportar miMotivoFabTheme (ver themes/mundial/mundialFabTheme.js)
 *   3. Registrar en themes/index.js y setear ACTIVE_FAB_THEME_ID
 */
export { default as FabGeneral } from './FabGeneral';
export { FAB_THEMES, ACTIVE_FAB_THEME_ID, activeFabTheme } from './themes';
