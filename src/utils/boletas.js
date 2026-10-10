// Identidad estable de las entradas de mercadería ("boletas").
//
// Antes una boleta se identificaba por su POSICIÓN en el array (`boleta-3`): al borrar o
// reordenar una entrada, los pagos y vínculos apuntaban a otra boleta sin avisar.
// Ahora cada entrada tiene un `id` propio. Las entradas viejas sin id siguen funcionando
// por posición hasta que se les asigna uno (script de migración de la Fase 3).

/** Genera un id único y corto para una entrada de mercadería. */
export const generarIdEntrada = () => {
  const azar = Math.random().toString(36).slice(2, 7);
  return `ent_${Date.now().toString(36)}${azar}`;
};

/**
 * Id de la boleta de una entrada. Con id propio es estable; sin id cae a la posición
 * (comportamiento anterior), así nada se rompe mientras se migra.
 */
export const idBoleta = (entrada, index) =>
  (entrada && entrada.id ? `boleta-${entrada.id}` : `boleta-${index}`);

/**
 * ¿La boleta de mercadería ya vinculada en un saldo es la misma que `boleta`?
 * Compara por id de entrada cuando ambas lo tienen; si no, por posición (datos viejos).
 */
export const esMismaBoleta = (vinculada, boleta) => {
  if (!vinculada || !boleta) return false;
  if (vinculada.mercaderiaEntradaId && boleta.entradaId) {
    return vinculada.mercaderiaEntradaId === boleta.entradaId;
  }
  return vinculada.mercaderiaIndex !== undefined && vinculada.mercaderiaIndex === boleta.index;
};

