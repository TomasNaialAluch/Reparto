// Cerebro del bot: dado lo que escribió el cliente y el estado de la conversación, decide qué contestar.
// No toca Firebase ni Gemini: todo lo que necesita entra por `deps`, así se prueba entero con datos falsos.
// Sirve igual para el chat de la página (prueba) y para WhatsApp. Diseño: README-PEDIDOS-BACKEND.md.
import { esBaja, esSinPedido, interpretarRespuesta } from './compartido/interpretarRespuesta.js';
import {
  opcionDeMenu, promocionesVigentes, textoEstadoPedido, textoHorarios, textoMenu, textoPrecios, textoPromociones,
} from './compartido/pedidosBot.js';
import { DIAS, diaSemana, sumarDias } from './compartido/whatsapp.js';

export const ZONA = 'America/Argentina/Buenos_Aires';
const APERTURA = 4 * 60; // 4:00
const CIERRE = 12 * 60; // 12:00

export const TEXTOS = {
  audio: 'Por ahora no puedo escuchar audios ni ver imágenes. Escribime el pedido, o elegí la opción 6 para hablar con una persona.',
  pedirPedido: 'Escribime los cortes y los kilos, por ejemplo: 10 kg asado, 5 kg vacío.',
  noEntendi: 'No te entendí. Escribime los cortes y los kilos, por ejemplo: 10 kg asado, 5 kg vacío. O escribí "menú" para ver las opciones.',
  sinPedido: 'Listo, hoy no anoto nada. Cuando quieras hacer un pedido, escribime.',
  revisar: 'Anoté tu mensaje, pero hay algo que quiero confirmar con una persona. Te escribimos enseguida.',
  humano: 'Listo, ya aviso para que te atienda una persona. Te van a escribir a la brevedad.',
  sinDato: 'Ese dato no lo tengo cargado. Te paso con una persona que te lo confirma.',
  baja: 'Listo, no te mandamos más mensajes automáticos. Si querés volver a recibirlos, escribinos.',
  sinIdentificar: 'Para consultar un pedido necesito saber quién sos y todavía no te tengo identificado. Elegí la opción 6 y una persona te ayuda.',
  menuAbajo: 'Si querés ver las opciones, escribí "menú".',
};

// ── Hora y fecha de Argentina ───────────────────────────────────────────────────────────

/** { fecha: 'YYYY-MM-DD', minutos: 0..1439, dow: 0 (domingo) a 6 } en hora de Buenos Aires. */
export const ahoraAR = (ahora = new Date()) => {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(ahora).map((p) => [p.type, p.value])
  );
  const fecha = `${partes.year}-${partes.month}-${partes.day}`;
  return { fecha, minutos: Number(partes.hour) * 60 + Number(partes.minute), dow: diaSemana(fecha) };
};

/** Atienden de lunes a sábado, de 4 a 12 hs. */
export const estaAbierto = ({ minutos, dow }) => dow !== 0 && minutos >= APERTURA && minutos < CIERRE;

/** Decisión 1: hasta las 12 va a hoy; después, al próximo día de reparto (se saltea el domingo). */
export const fechaDelPedido = ({ fecha, minutos, dow }) => {
  if (dow !== 0 && minutos < CIERRE) return fecha;
  let siguiente = sumarDias(fecha, 1);
  if (diaSemana(siguiente) === 0) siguiente = sumarDias(siguiente, 1);
  return siguiente;
};

/** "hoy", "mañana" o "el lunes". */
export const etiquetaDia = (fecha, hoy) => {
  if (fecha === hoy) return 'hoy';
  if (fecha === sumarDias(hoy, 1)) return 'mañana';
  return `el ${DIAS.find((d) => d.n === diaSemana(fecha))?.largo.toLowerCase()}`;
};

// ── Utilidades de texto ─────────────────────────────────────────────────────────────────

const fmtKg = (kg) => String(kg).replace('.', ',');
const normal = (t) => String(t ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[¡!¿?.,]/g, ' ').replace(/\s+/g, ' ').trim();

// Solo es saludo si el mensaje es eso y nada más ("hola", "buen día, qué tal"); "hola, hacen envíos?" es una pregunta.
const SALUDO = /^(hola|holis|buen(os|as)?( dias?| tardes?| noches?)?|menu|inicio|ayuda|opciones|volver)( que tal| como (estas|andas|andan|va)| buen(os|as)?( dias?| tardes?| noches?)?)*$/;
// Las palabras clave del menú solo valen en mensajes cortos; una pregunta larga va a las preguntas frecuentes.
const MAX_PALABRAS_CLAVE = 5;
const SI = /^(1|si|sip|ok|dale|listo|correcto|confirmo|esta bien|joya)$/;
const NO = /^(2|no|nop|corregir|cambiar|mal)$/;
const SOLO_NUMERO = /^\s*(opcion\s*)?\d\s*[.)]?\s*$/i;

/** "10 kg Asado" para mostrarle al cliente. */
const lineaVisible = (r) => `${fmtKg(r.kg)} kg ${r.corte || r.texto}`;
/** "10 Asado": el formato de los renglones de la página Hoy. */
const lineaRenglon = (r) => `${fmtKg(r.kg)} ${r.corte || r.texto}`;

const respuesta = (respuestas, estado, extra = {}) => ({ respuestas, estado, pendiente: null, accion: null, ...extra });

// ── Piezas del flujo ────────────────────────────────────────────────────────────────────

const mostrarMenu = (aviso) => respuesta([...(aviso ? [aviso] : []), textoMenu()], 'menu');

/** Un pedido por texto: si todo es claro pide confirmación; si hay dudas lo deja para una persona. */
const procesarPedido = (interpretado, reloj) => {
  const renglones = interpretado.renglones;
  const todoSeguro = renglones.length > 0 && renglones.every((r) => r.seguridad === 'segura');
  if (!todoSeguro) {
    return respuesta([TEXTOS.revisar], 'menu', { accion: { tipo: 'revisar', renglones } });
  }
  const fecha = fechaDelPedido(reloj);
  const cuando = etiquetaDia(fecha, reloj.fecha);
  const cerrado = !estaAbierto(reloj);
  const lineas = renglones.map(lineaVisible).join('\n');
  const aviso = cerrado
    ? `\nAhora estamos cerrados (atendemos de lunes a sábado, de 4 a 12 hs): tu pedido queda para ${cuando}.`
    : '';
  return respuesta(
    [`Anoté para ${cuando}:\n${lineas}${aviso}\n\n¿Está bien?\n1. Sí\n2. Corregir`],
    'confirmando',
    { pendiente: { renglones: renglones.map(lineaRenglon), fecha } }
  );
};

const ejecutarOpcion = (opcion, deps, reloj, entrada) => {
  switch (opcion) {
    case 'pedido':
      return respuesta([TEXTOS.pedirPedido], 'pedido');
    case 'horarios':
      return respuesta([textoHorarios(deps.config || {})], 'menu');
    case 'precios':
      return respuesta([textoPrecios(deps.precios || [], deps.actualizado || '')], 'menu');
    case 'promociones':
      return respuesta([textoPromociones(promocionesVigentes(deps.promociones || [], reloj.fecha))], 'menu');
    case 'estado':
      if (!entrada.identificado) return respuesta([TEXTOS.sinIdentificar], 'menu');
      return respuesta([textoEstadoPedido(deps.ultimoPedido || null)], 'menu');
    case 'humano':
      return respuesta([TEXTOS.humano], 'humano', { accion: { tipo: 'humano', motivo: 'pidio' } });
    default:
      return mostrarMenu();
  }
};

/** Texto suelto: contesta la IA solo con las preguntas frecuentes; si no sabe, pasa a una persona. */
const textoLibre = async (texto, deps) => {
  const faq = (deps.faq || []).filter((f) => f.activa !== false && f.respuesta);
  if (faq.length === 0 || typeof deps.llm !== 'function') {
    return respuesta([TEXTOS.sinDato], 'humano', { accion: { tipo: 'humano', motivo: 'sinRespuesta', texto } });
  }
  let salida = null;
  try {
    salida = await deps.llm({ texto, faq });
  } catch {
    salida = null; // si la IA falla, no se inventa nada: pasa a una persona
  }
  if (salida?.respondible === true && typeof salida.respuesta === 'string' && salida.respuesta.trim()) {
    return respuesta([salida.respuesta.trim(), TEXTOS.menuAbajo], 'menu', { accion: { tipo: 'ia', texto } });
  }
  return respuesta([TEXTOS.sinDato], 'humano', { accion: { tipo: 'humano', motivo: 'sinRespuesta', texto } });
};

// ── Entrada principal ───────────────────────────────────────────────────────────────────

/**
 * entrada: { canal: 'web' | 'whatsapp', estado, pendiente, texto, media, ahora, identificado }
 * deps: { cortes, precios, actualizado, promociones, faq, config, ultimoPedido, llm }
 * Devuelve { respuestas: [texto], estado, pendiente, accion } con accion = null o
 *   { tipo: 'crearPedido' | 'revisar' | 'humano' | 'baja' | 'ia', ... }.
 */
export const responder = async (entrada, deps = {}) => {
  const estado = entrada.estado || 'menu';
  const texto = String(entrada.texto ?? '').trim().slice(0, 600);
  const reloj = ahoraAR(entrada.ahora || new Date());
  const t = normal(texto);
  const menuPedido = SALUDO.test(t);

  if (entrada.media === 'audio' || entrada.media === 'imagen') {
    return respuesta([TEXTOS.audio], estado, { pendiente: entrada.pendiente || null });
  }
  if (!texto) return mostrarMenu();
  if (esBaja(texto)) return respuesta([TEXTOS.baja], 'menu', { accion: { tipo: 'baja' } });

  // Con una persona atendiendo, el bot se calla en WhatsApp. En la prueba de la página se puede volver.
  if (estado === 'humano') {
    if (entrada.canal === 'web') {
      return menuPedido
        ? mostrarMenu()
        : respuesta(['(Prueba) Estás en atención humana: acá no hay nadie del otro lado. Escribí "menú" para volver al bot.'], 'humano');
    }
    return respuesta([], 'humano');
  }

  if (estado === 'confirmando') {
    if (SI.test(t)) {
      const p = entrada.pendiente;
      if (!p?.renglones?.length) return mostrarMenu();
      const cuando = etiquetaDia(p.fecha, reloj.fecha);
      return respuesta(
        [`Listo, tu pedido quedó anotado para ${cuando}. ¡Gracias!`],
        'menu',
        { accion: { tipo: 'crearPedido', renglones: p.renglones, fecha: p.fecha } }
      );
    }
    if (NO.test(t)) return respuesta([TEXTOS.pedirPedido], 'pedido');
    if (menuPedido) return mostrarMenu();
    const nuevo = interpretarRespuesta(texto, deps.cortes || []);
    if (nuevo.tipo === 'pedido') return procesarPedido(nuevo, reloj);
    return respuesta(['Respondé 1 si está bien o 2 para corregir.'], 'confirmando', { pendiente: entrada.pendiente });
  }

  if (estado === 'pedido') {
    if (menuPedido) return mostrarMenu();
    if (esSinPedido(texto)) return respuesta([TEXTOS.sinPedido], 'menu');
    const interpretado = interpretarRespuesta(texto, deps.cortes || []);
    if (interpretado.tipo === 'pedido') return procesarPedido(interpretado, reloj);
    return respuesta([TEXTOS.noEntendi], 'pedido');
  }

  // estado 'menu'
  if (menuPedido) return mostrarMenu();
  if (SOLO_NUMERO.test(texto)) {
    const opcion = opcionDeMenu(texto);
    return opcion ? ejecutarOpcion(opcion, deps, reloj, entrada) : mostrarMenu('Esa opción no existe.');
  }
  const interpretado = interpretarRespuesta(texto, deps.cortes || []);
  if (interpretado.tipo === 'pedido') return procesarPedido(interpretado, reloj);
  const opcion = t.split(' ').length <= MAX_PALABRAS_CLAVE ? opcionDeMenu(texto) : null;
  if (opcion) return ejecutarOpcion(opcion, deps, reloj, entrada);
  return textoLibre(texto, deps);
};
