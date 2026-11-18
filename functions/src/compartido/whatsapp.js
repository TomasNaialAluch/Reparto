// COPIA AUTOMÁTICA de src/utils (no editar acá: se corre `npm run sync` en functions/).
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

// ── Programación con varios envíos por cliente ──────────────────────────────────────────

const pad2 = (n) => String(n).padStart(2, '0');
const aFecha = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

/** Suma días a una fecha YYYY-MM-DD sin pasar por UTC (cuida los cambios de horario). */
export const sumarDias = (fecha, n) => {
  const [y, m, d] = fecha.split('-').map(Number);
  return aFecha(new Date(y, m - 1, d + n));
};

/**
 * Lista de envíos de una programación: [{ id, dias, hora, plantillaId? }].
 * Acepta el formato nuevo (`envios[]`) y el primero, con un solo `dias` + `hora` por cliente.
 */
export const enviosDe = (programacion) => {
  if (!programacion) return [];
  if (Array.isArray(programacion.envios)) return programacion.envios;
  if (Array.isArray(programacion.dias) && programacion.dias.length > 0) {
    return [{ id: 'unico', dias: programacion.dias, hora: programacion.hora || '08:00' }];
  }
  return [];
};

/** ¿Esa fecha está salteada a mano o cae dentro de una pausa (`pausadoHasta`, inclusive)? */
export const fechaSalteada = (programacion, fecha) =>
  (programacion?.saltear || []).includes(fecha)
  || Boolean(programacion?.pausadoHasta && fecha <= programacion.pausadoHasta);

/**
 * Envíos que tocan entre `desde` y los `dias` siguientes (YYYY-MM-DD), ordenados por fecha y hora.
 * Respeta `activo`, pausas y fechas salteadas. No mira el consentimiento: eso lo decide el backend.
 */
export const proximosEnvios = (programaciones = [], desde, dias = 7) => {
  const salida = [];
  for (let i = 0; i < dias; i += 1) {
    const fecha = sumarDias(desde, i);
    const dow = diaSemana(fecha);
    programaciones.forEach((p) => {
      if (p?.activo === false || fechaSalteada(p, fecha)) return;
      enviosDe(p).forEach((e) => {
        if ((e.dias || []).includes(dow)) {
          salida.push({
            fecha, hora: e.hora || '08:00', clienteId: p.clienteId || p.id, cliente: p.cliente || '', envioId: e.id,
          });
        }
      });
    });
  }
  return salida.sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
};

const VENTANA_MS = 24 * 60 * 60 * 1000;

/**
 * WhatsApp solo deja escribir con texto libre dentro de las 24 hs del último mensaje del cliente.
 * Pasado ese tiempo hay que usar una plantilla aprobada. A las 24 hs justas ya no vale.
 */
export const estaEnVentana = (ultimoEntrante, ahora = new Date()) => {
  if (!ultimoEntrante) return false;
  const t = new Date(ultimoEntrante).getTime();
  if (Number.isNaN(t)) return false;
  return new Date(ahora).getTime() - t < VENTANA_MS;
};

const aMinutos = (hhmm) => {
  const [h, m] = String(hhmm || '').split(':').map(Number);
  return h * 60 + (m || 0);
};

/** ¿Esa hora (HH:MM) cae en el horario de silencio { desde, hasta }? Sirve cuando cruza la medianoche. */
export const enSilencio = (hora, horario) => {
  if (!horario?.desde || !horario?.hasta) return false;
  const h = aMinutos(hora);
  const d = aMinutos(horario.desde);
  const a = aMinutos(horario.hasta);
  if (d === a) return false;
  return d < a ? h >= d && h < a : h >= d || h < a;
};

/** Reemplaza {variable} por su valor; las que no vienen quedan vacías. */
export const resolverVariables = (plantilla, valores = {}) =>
  String(plantilla ?? '').replace(/\{(\w+)\}/g, (_, clave) => String(valores[clave] ?? ''));
