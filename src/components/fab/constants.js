/** Tamaño del botón flotante y capas z-index del sistema FAB */
export const FAB_TRIGGER_SIZE = 52;

// Piso libre para que la pelota rebote sin meterse detrás de la FloatingNavbar
// (fixed, abajo, ~70px de alto propio). Se usa como límite de rebote en
// useFabPhysics y para la posición de reposo/arco.
// Ver src/components/floatingNavbar/FloatingNavbar.css.
export const FAB_FLOOR_OFFSET = 90;

export const FAB_INITIAL_OFFSET = { right: 24, bottom: 160 };

/** Arco fijo arriba a la derecha de la FloatingNavbar */
export const FAB_GOAL = {
  width: 56,
  height: 42,
  right: 14,
  bottom: FAB_FLOOR_OFFSET,
};

export const FAB_Z_INDEX = {
  trigger: 1200,
  goal: 1201,
  overlay: 1250,
  modal: 1251,
};

/** Física por defecto del rebote (cada tema puede sobreescribir en su config) */
export const FAB_PHYSICS_DEFAULTS = {
  friction: 0.992,
  bounceDamp: 0.88,
  stopThreshold: 0.35,
  autoKickMinMs: 14_000,
  autoKickMaxMs: 22_000,
  autoKickPower: 0.85,
  clickKickPower: 1.35,
};

/**
 * Auto-guardado por inactividad: si no se toca la pelota/arco, se guarda sola
 * en el arco (como un click manual). Mientras siga sin tocarse, cada tanto
 * "asoma" un ratito para recordar que existe y vuelve a guardarse — así
 * indefinidamente hasta que el usuario la toque, lo que reinicia todo.
 */
export const FAB_IDLE_STORE_MS = 3 * 60 * 1000; // 3 min sin tocar -> se guarda sola
export const FAB_PEEK_INTERVAL_MS = 5 * 60 * 1000; // cada 5 min guardada -> asoma
export const FAB_PEEK_DURATION_MS = 30 * 1000; // tiempo afuera antes de re-guardarse
