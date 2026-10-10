// Utilidades para comparar nombres de personas/proveedores.
// "José " y "jose" deben contar como el mismo nombre.

/** Minúsculas, sin tildes y con espacios colapsados. Es la clave para detectar duplicados. */
export const normalizarNombre = (valor) =>
  String(valor ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

/** Distancia de edición entre dos textos (cuántos cambios de letras los separan). */
export const distanciaEdicion = (a, b) => {
  const filas = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j += 1) filas[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      filas[i][j] = Math.min(
        filas[i - 1][j] + 1,
        filas[i][j - 1] + 1,
        filas[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return filas[a.length][b.length];
};

/**
 * ¿Dos nombres son "parecidos" sin ser iguales? Sirve para avisar de un posible duplicado
 * antes de crear un contacto. Nunca une nada por sí solo.
 */
export const sonParecidos = (a, b) => {
  const x = normalizarNombre(a);
  const y = normalizarNombre(b);
  if (!x || !y || x === y) return false;
  if (x.length < 4 || y.length < 4) return false;
  if (Math.abs(x.length - y.length) > 3) return false;
  return distanciaEdicion(x, y) <= 1 || x.startsWith(y) || y.startsWith(x);
};
