// Utilidades de la sección Pedidos por WhatsApp: teléfonos, días y mensajes.
// Son independientes del proveedor (Twilio o Meta): lo que cambie al conectar se resuelve en el backend.

/** Lunes a domingo, con el número que devuelve Date.getDay() (0 = domingo). */
export const DIAS = [
  { n: 1, corto: 'Lun', largo: 'Lunes' },
  { n: 2, corto: 'Mar', largo: 'Martes' },
  { n: 3, corto: 'Mié', largo: 'Miércoles' },
  { n: 4, corto: 'Jue', largo: 'Jueves' },
  { n: 5, corto: 'Vie', largo: 'Viernes' },
  { n: 6, corto: 'Sáb', largo: 'Sábado' },
  { n: 0, corto: 'Dom', largo: 'Domingo' },
];

export const MENSAJE_BASE = 'Hola {nombre}, ¿qué te mando hoy?';

/**
 * Teléfono argentino → formato internacional de móvil (+549...). Devuelve null si no se puede.
 * Acepta "011 15 4567-8901", "11 4567 8901", "+54 9 11 4567 8901", etc.
 * Es una heurística: el formato exacto que pide el proveedor se confirma al conectarlo.
 */
export const normalizarTelefonoAR = (texto) => {
  let d = String(texto || '').replace(/\D/g, '');
  if (!d) return null;
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('54')) d = d.slice(2); // código de país
  if (d.startsWith('9')) d = d.slice(1); // el 9 de móvil (ningún código de área empieza con 9)
  if (d.startsWith('0')) d = d.slice(1); // 0 del discado nacional
  // El "15" del celular va justo después del código de área (2 a 4 dígitos).
  if (d.length === 12) {
    for (const largoArea of [2, 3, 4]) {
      if (d.slice(largoArea, largoArea + 2) === '15') {
        d = d.slice(0, largoArea) + d.slice(largoArea + 2);
        break;
      }
    }
  }
  if (d.length !== 10) return null;
  if (d.startsWith('15')) return null; // "15 xxxx xxxx" sin código de área: no alcanza para WhatsApp
  return `+549${d}`;
};

/** Día de la semana (0 = domingo) de una fecha YYYY-MM-DD, sin pasar por UTC. */
export const diaSemana = (fecha) => {
  const [y, m, d] = fecha.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
};

/** ¿A este cliente le toca mensaje en esa fecha? */
export const tocaEnFecha = (programacion, fecha) =>
  programacion?.activo !== false && (programacion?.dias || []).includes(diaSemana(fecha));

/** "Lun · Jue" */
export const resumenDias = (dias = []) =>
  DIAS.filter((d) => dias.includes(d.n)).map((d) => d.corto).join(' · ');

/** Reemplaza las variables de la plantilla ({nombre}). */
export const aplicarVariables = (plantilla, { nombre = '' } = {}) =>
  String(plantilla || MENSAJE_BASE).replace(/\{nombre\}/gi, nombre);

/** Respuesta del cliente → renglones de pedido (uno por línea o separados por ";"). */
export const parsearRenglones = (texto) =>
  String(texto || '').split(/\n|;/).map((s) => s.trim()).filter(Boolean);
