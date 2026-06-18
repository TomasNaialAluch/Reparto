/** Tamaño del botón flotante y capas z-index del sistema FAB */
export const FAB_TRIGGER_SIZE = 52;

export const FAB_INITIAL_OFFSET = { right: 24, bottom: 88 };

/** Arco fijo abajo a la derecha */
export const FAB_GOAL = {
  width: 56,
  height: 42,
  right: 14,
  bottom: 14,
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
