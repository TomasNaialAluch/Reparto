// Reconocimiento de cortes escritos a mano en la carga rápida de pesadas.
// Todo es local y determinista (sin IA). Ante la duda NO adivina: deja el texto como
// "dudoso"/"nuevo" y se valida al ingresar a Mercadería.
//
// Ver README-PESADAS-CARGA-RAPIDA.md, secciones 3 y 4.
import { normalizarNombre, sonParecidos } from './nombres';
import { parseKg } from './pesadas';

const MIN_LETRAS_PARCIAL = 3;
const MAX_CANDIDATOS = 5;

/** Distancia de edición que cuenta una letra cambiada de lugar ("bondoila") como un solo error. */
const distanciaConIntercambio = (a, b) => {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j += 1) d[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const costo = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + costo);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
};

/** ¿Parece un error de tipeo? Más tolerante cuanto más largo es el nombre. */
const pareceTipeo = (a, b) => {
  if (a.length < 4 || b.length < 4 || Math.abs(a.length - b.length) > 2) return false;
  const tolerancia = Math.min(a.length, b.length) >= 8 ? 2 : 1;
  return distanciaConIntercambio(a, b) <= tolerancia;
};

/** Estas coincidencias entran solas, sin pasar por la validación. */
export const MATCH_SEGURO = ['exacto', 'alias', 'parcial'];

/**
 * Reconoce un texto contra el catálogo de cortes activos.
 * Devuelve { corteId, corte, match, candidatos } o null si el texto está vacío.
 *   match: 'exacto' | 'alias' | 'parcial' | 'dudoso' | 'nuevo'
 */
export const reconocerCorte = (texto, catalogo = []) => {
  const norm = normalizarNombre(texto);
  if (!norm) return null;

  // 1) Igual al nombre de un corte
  const exacto = catalogo.find((c) => c.nombreNormalizado === norm);
  if (exacto) return { corteId: exacto.id, corte: exacto.nombre, match: 'exacto', candidatos: [] };

  // 2) Igual a un alias guardado
  const porAlias = catalogo.find((c) => (c.alias || []).some((a) => normalizarNombre(a) === norm));
  if (porAlias) return { corteId: porAlias.id, corte: porAlias.nombre, match: 'alias', candidatos: [] };

  // 3) Coincidencia parcial: solo entra sola si hay UN único candidato y el texto tiene 3+ letras
  const contienen = norm.length >= MIN_LETRAS_PARCIAL
    ? catalogo.filter((c) => (c.nombreNormalizado || '').includes(norm))
    : [];
  if (contienen.length === 1) {
    const unico = contienen[0];
    return { corteId: unico.id, corte: unico.nombre, match: 'parcial', candidatos: [] };
  }

  // 4) y 5) Dudoso: varios candidatos, el texto contiene un corte, o es parecido (error de tipeo)
  const candidatos = new Map();
  contienen.forEach((c) => candidatos.set(c.id, c.nombre));
  catalogo.forEach((c) => {
    const nombre = c.nombreNormalizado || '';
    if (nombre.length >= 4 && norm.includes(nombre)) candidatos.set(c.id, c.nombre);
    else if (sonParecidos(norm, nombre) || pareceTipeo(norm, nombre)) candidatos.set(c.id, c.nombre);
  });
  if (candidatos.size > 0) {
    return {
      corteId: null,
      corte: null,
      match: 'dudoso',
      candidatos: [...candidatos.values()].slice(0, MAX_CANDIDATOS),
    };
  }

  // 6) Nada
  return { corteId: null, corte: null, match: 'nuevo', candidatos: [] };
};

/**
 * Separa la línea en texto y kg: el ÚLTIMO número son los kg, todo lo anterior es el corte.
 *   "lomo 12,3"  → { texto: 'lomo', kg: 12.3 }
 *   "12,3"       → { texto: '',     kg: 12.3 }
 *   "vacio"      → { texto: 'vacio', kg: null }
 */
export const separarTextoYKg = (linea) => {
  const limpia = String(linea ?? '').trim().replace(/\s+/g, ' ');
  if (!limpia) return { texto: '', kg: null };
  const m = limpia.match(/^(.*?)\s*(\d+(?:[.,]\d+)?)$/);
  if (!m) return { texto: limpia, kg: null };
  const kg = parseKg(m[2]);
  if (Number.isNaN(kg)) return { texto: limpia, kg: null };
  return { texto: m[1].trim(), kg };
};

/**
 * Interpreta una línea de la carga rápida.
 *   tipo: 'vacio' | 'solo-corte' | 'solo-kg' | 'completo'
 * `actual` es el corte vigente ({ texto, ...reconocimiento }) para cuando se escribe solo un número.
 */
export const interpretarLinea = (linea, catalogo, actual = null) => {
  const limpia = String(linea ?? '').trim();
  if (!limpia) return { tipo: 'vacio' };

  // Un corte cuyo nombre termina en número ("Nalga 2") no debe cortarse: si la línea
  // completa ya es un corte conocido, es solo el corte.
  const completa = reconocerCorte(limpia, catalogo);
  if (completa && (completa.match === 'exacto' || completa.match === 'alias')) {
    return { tipo: 'solo-corte', texto: limpia, rec: completa, kg: null };
  }

  const { texto, kg } = separarTextoYKg(limpia);
  if (!texto && kg !== null) {
    return { tipo: 'solo-kg', texto: actual?.texto || '', rec: actual?.rec || null, kg };
  }
  const rec = reconocerCorte(texto, catalogo);
  if (kg === null) return { tipo: 'solo-corte', texto, rec, kg: null };
  return { tipo: 'completo', texto, rec, kg };
};

/**
 * Decisión inicial para un texto sin validar: si hay un único candidato sugerido,
 * ya viene elegido. `catalogo` es la lista de cortes activos.
 */
export const decisionInicial = (pendiente, catalogo) => {
  const sugerido = pendiente.candidatos?.length === 1
    ? catalogo.find((c) => c.nombre === pendiente.candidatos[0])
    : null;
  return {
    modo: 'existente',
    corteId: sugerido?.id || '',
    nombreNuevo: pendiente.texto || '',
    categoria: '',
    recordar: true,
  };
};

export const decisionCompleta = (d) => {
  if (!d) return false;
  return d.modo === 'nuevo' ? !!d.nombreNuevo.trim() : !!d.corteId;
};

/**
 * Cortes que un proveedor suele traer, del más al menos frecuente.
 * `uso` es { corteNormalizado: veces } (usePreciosReferencia.usoCortesDe).
 * Devuelve [{ corte, veces }] con `corte` = el objeto del catálogo.
 */
export const cortesHabituales = (uso, catalogo = []) => {
  if (!uso) return [];
  return catalogo
    .map((c) => ({ corte: c, veces: uso[c.nombreNormalizado] || 0 }))
    .filter((x) => x.veces > 0)
    .sort((a, b) => b.veces - a.veces);
};

/**
 * Entre los cortes habituales del proveedor, los que se parecen al texto:
 * comparten el comienzo, uno contiene al otro o parece un error de tipeo.
 */
export const habitualesParecidos = (texto, habituales = []) => {
  const norm = normalizarNombre(texto);
  if (!norm) return [];
  const inicio = norm.slice(0, 3);
  return habituales.filter(({ corte }) => {
    const n = corte.nombreNormalizado || '';
    if (!n) return false;
    return n.includes(norm)
      || (n.length >= 4 && norm.includes(n))
      || (norm.length >= 3 && n.startsWith(inicio))
      || pareceTipeo(norm, n);
  });
};
