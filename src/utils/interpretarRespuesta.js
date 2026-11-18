// Convierte lo que escribe un cliente por WhatsApp en renglones de pedido.
// Es local y determinista (sin IA), igual que la carga rápida de pesadas: usa el catálogo de
// cortes de `cortes.js`. Ante la duda NO adivina: marca el renglón para revisar.
import { normalizarNombre } from './nombres';
import { MATCH_SEGURO, reconocerCorte } from './cortes';
import { parseKg } from './pesadas';

/** Se separa por salto de línea, ";", "," (menos la coma decimal: "3,5") y " y ". */
const SEPARADORES = /\n|;|,(?!\d)|\s+y\s+/i;

const UNIDADES = '(?:kgs?|kilos?|kilogramos?|k)';

const normalizar = (texto) => normalizarNombre(texto).replace(/[¡!¿?.]+/g, ' ').replace(/\s+/g, ' ').trim();

/** "BAJA", "no quiero más mensajes", "darme de baja"... */
export const esBaja = (texto) => {
  const t = normalizar(texto);
  return /^(baja|stop|parar|basta)$/.test(t)
    || /\bdar(me)? de baja\b/.test(t)
    || /\bno (quiero|me manden|me mandes|envien|envies) (mas )?(mensajes|whatsapp)\b/.test(t);
};

/** "hoy no", "no necesito", "nada por hoy"... */
export const esSinPedido = (texto) => {
  // Solo frases completas: "hoy no sé si..." o "hoy no hay 5 kg de nada" NO son "no pido nada".
  const t = normalizar(texto);
  return /^(hoy )?no( gracias| necesito| hace falta| hay| tengo| preciso| voy a pedir)?( nada| por hoy| hoy)?( gracias)?$/.test(t)
    || /^(nada|nada hoy|nada por hoy|por hoy nada|por hoy no|hoy nada|no hoy)( gracias)?$/.test(t);
};

/**
 * Una línea → { texto, kg }. Entiende "10 kg asado", "asado 10 kg", "asado 10", "3,5 bondiola".
 * `kg` es null si no hay número.
 */
export const separarRenglon = (linea) => {
  const limpia = String(linea ?? '').trim().replace(/\s+/g, ' ');
  if (!limpia) return { texto: '', kg: null };

  // Número primero: "10 kg asado", "5 kilos de vacío", "3,5 bondiola"
  const inicio = limpia.match(new RegExp(`^(\\d+(?:[.,]\\d+)?)\\s*(?:${UNIDADES}\\b)?\\s*(?:de\\s+)?(.+)$`, 'i'));
  if (inicio && /[a-záéíóúñ]/i.test(inicio[2])) {
    const kg = parseKg(inicio[1]);
    if (!Number.isNaN(kg)) return { texto: inicio[2].trim(), kg };
  }

  // Número al final: "asado 10", "asado 10 kg"
  const final = limpia.match(new RegExp(`^(.*?)\\s*(\\d+(?:[.,]\\d+)?)\\s*(?:${UNIDADES})?$`, 'i'));
  if (final && final[1].trim()) {
    const kg = parseKg(final[2]);
    if (!Number.isNaN(kg)) return { texto: final[1].trim().replace(/\s+de$/i, ''), kg };
  }

  return { texto: limpia, kg: null };
};

/**
 * Seguridad de un renglón, para mostrarla en la bandeja:
 *   'segura'     → corte reconocido y kg
 *   'revisar'    → falta confirmar el corte (dudoso o nuevo)
 *   'incompleta' → no trae kg
 */
const seguridadDe = (rec, kg) => {
  if (kg === null || kg <= 0) return 'incompleta';
  return rec && MATCH_SEGURO.includes(rec.match) ? 'segura' : 'revisar';
};

/**
 * Interpreta un mensaje entrante.
 *   tipo: 'baja' | 'sinPedido' | 'pedido' | 'audio' | 'imagen' | 'vacio' | 'otro'
 *   renglones: [{ texto, kg, corteId, corte, match, candidatos, seguridad }]
 * Un mensaje es 'pedido' si al menos un renglón trae cantidad. Si no, es 'otro': una pregunta o
 * texto suelto que el bot trata con el menú o con las preguntas frecuentes.
 * `media` es el tipo de adjunto ('audio' | 'imagen') cuando el mensaje no trae texto.
 */
export const interpretarRespuesta = (texto, catalogo = [], { media = null } = {}) => {
  if (media === 'audio') return { tipo: 'audio', renglones: [] };
  if (media === 'imagen') return { tipo: 'imagen', renglones: [] };

  const limpio = String(texto ?? '').trim();
  if (!limpio) return { tipo: 'vacio', renglones: [] };
  if (esBaja(limpio)) return { tipo: 'baja', renglones: [] };
  if (esSinPedido(limpio)) return { tipo: 'sinPedido', renglones: [] };

  const renglones = limpio
    .split(SEPARADORES)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((linea) => {
      const { texto: corteTexto, kg } = separarRenglon(linea);
      const rec = corteTexto ? reconocerCorte(corteTexto, catalogo) : null;
      return {
        texto: corteTexto,
        kg,
        corteId: rec?.corteId ?? null,
        corte: rec?.corte ?? null,
        match: rec?.match ?? 'nuevo',
        candidatos: rec?.candidatos ?? [],
        seguridad: seguridadDe(rec, kg),
      };
    })
    .filter((r) => r.texto || r.kg !== null);

  const hayCantidad = renglones.some((r) => r.kg !== null && r.kg > 0 && r.texto);
  return { tipo: hayCantidad ? 'pedido' : 'otro', renglones: hayCantidad ? renglones : [] };
};
