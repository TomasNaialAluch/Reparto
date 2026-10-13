// Utilidades de la página Hoy / Pesadas. Los totales siempre se calculan desde las pesadas cargadas.
import { normalizarNombre } from './nombres';

/** "12,35" o "12.35" → 12.35. Devuelve NaN si no es un número. */
export const parseKg = (texto) => {
  const limpio = String(texto ?? '').trim().replace(/\s+/g, '').replace(',', '.');
  if (!limpio || !/^\d*\.?\d+$/.test(limpio)) return NaN;
  return Number(limpio);
};

/** Redondea a 3 decimales para que la suma de flotantes no deje "12.350000001". */
export const redondearKg = (n) => Math.round((Number(n) || 0) * 1000) / 1000;

export const formatKg = (n) =>
  `${(Number(n) || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 3 })} kg`;

export const generarIdPesada = (prefijo = 'pes') =>
  `${prefijo}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/**
 * ¿La pesada individual ya tiene un corte del catálogo?
 * Las cargadas con la versión anterior (sin `match`) traen `corte` y cuentan como resueltas.
 */
export const estaResuelto = (it) => !!it.corteId || (it.match === undefined && !!it.corte);

/** Nombre a mostrar: el corte resuelto o, si no, lo que se escribió. */
export const etiquetaItem = (it) => (estaResuelto(it) ? it.corte : (it.texto || it.corte || ''));

/** Clave de agrupación: corte resuelto, o el texto normalizado si todavía no se validó. */
const claveItem = (it) => (estaResuelto(it)
  ? `c:${normalizarNombre(it.corte)}`
  : `t:${normalizarNombre(it.texto || it.corte)}`);

/** Totales por corte (en orden de primera aparición) y total general. */
export const totalesPesada = (pesadas = []) => {
  const porCorte = new Map();
  pesadas.forEach((p) => {
    const clave = claveItem(p);
    const actual = porCorte.get(clave)
      || { corte: etiquetaItem(p), cantidad: 0, kg: 0, pendiente: !estaResuelto(p) };
    actual.cantidad += 1;
    actual.kg += Number(p.kg) || 0;
    porCorte.set(clave, actual);
  });
  const cortes = [...porCorte.values()].map((c) => ({ ...c, kg: redondearKg(c.kg) }));
  return {
    cortes,
    cantidad: pesadas.length,
    kg: redondearKg(cortes.reduce((acc, c) => acc + c.kg, 0)),
  };
};

/** Textos sin validar, uno por texto distinto, con sus kg y cantidad de pesadas. */
export const pendientesDe = (pesadas = []) => {
  const mapa = new Map();
  pesadas.forEach((it) => {
    if (estaResuelto(it)) return;
    const texto = it.texto || it.corte || '';
    const clave = normalizarNombre(texto);
    if (!clave) return;
    const actual = mapa.get(clave)
      || { textoNorm: clave, texto, kg: 0, cantidad: 0, candidatos: it.candidatos || [] };
    actual.kg += Number(it.kg) || 0;
    actual.cantidad += 1;
    mapa.set(clave, actual);
  });
  return [...mapa.values()].map((p) => ({ ...p, kg: redondearKg(p.kg) }));
};

/** Cortes usados en la pesada, del más reciente al más antiguo, sin repetir. */
export const cortesRecientes = (pesadas = [], limite = 6) => {
  const vistos = [];
  for (let i = pesadas.length - 1; i >= 0 && vistos.length < limite; i -= 1) {
    const nombre = etiquetaItem(pesadas[i]);
    if (nombre && !vistos.includes(nombre)) vistos.push(nombre);
  }
  return vistos;
};

/** Suma (o resta) días a una fecha YYYY-MM-DD sin pasar por UTC. */
export const sumarDias = (fecha, dias) => {
  const [y, m, d] = fecha.split('-').map(Number);
  const nueva = new Date(y, m - 1, d + dias);
  const mm = String(nueva.getMonth() + 1).padStart(2, '0');
  const dd = String(nueva.getDate()).padStart(2, '0');
  return `${nueva.getFullYear()}-${mm}-${dd}`;
};

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

/** Nombre del día ("Martes") con el mismo criterio que Mercadería. */
export const diaDeFecha = (fecha) => {
  const [y, m, d] = fecha.split('-').map(Number);
  return DIAS[new Date(y, m - 1, d).getDay()];
};

/** Mercadería trabaja de lunes a sábado: el domingo cae en "Lunes", igual que getDiaActual. */
export const diaParaMercaderia = (fecha) => {
  const dia = diaDeFecha(fecha);
  return dia === 'Domingo' ? 'Lunes' : dia;
};

/** "martes 13 de octubre" */
export const fechaLarga = (fecha) => {
  const [y, m, d] = fecha.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
};

export const horaActual = () => {
  const ahora = new Date();
  return `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
};
