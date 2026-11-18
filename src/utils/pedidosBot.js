// Lógica del bot de WhatsApp (menú de entrada). Son funciones puras: no tocan Firebase ni Meta.
// El backend las usa para decidir qué contestar; acá están para probarlas y reutilizarlas en la página.
// Diseño: README-PEDIDOS-BOT.md.
import { normalizarNombre } from './nombres';

export const NOMBRE_NEGOCIO = 'Frigorífico La Trinidad';
export const DIRECCION_DEFAULT = 'José E. Rodó 6341, CABA';
export const HORARIOS_DEFAULT = 'lunes a sábado, de 4 a 12 hs. Domingos cerrado.';

/** El orden es el del menú que ve el cliente. */
export const OPCIONES_MENU = [
  { id: 'pedido', numero: 1, titulo: 'Hacer un pedido' },
  { id: 'horarios', numero: 2, titulo: 'Ver horarios y ubicación' },
  { id: 'precios', numero: 3, titulo: 'Pedir precios' },
  { id: 'promociones', numero: 4, titulo: 'Ver promociones' },
  { id: 'estado', numero: 5, titulo: 'Ver el estado de mi pedido' },
  { id: 'humano', numero: 6, titulo: 'Hablar con una persona' },
];

/** Texto del menú (también sirve de respaldo si el cliente no puede ver la lista desplegable). */
export const textoMenu = () => [
  `Hola! Somos ${NOMBRE_NEGOCIO}. ¿Qué querés hacer?`,
  '',
  ...OPCIONES_MENU.map((o) => `${o.numero}. ${o.titulo}`),
  '',
  'Respondé con el número de la opción.',
].join('\n');

// Se prueban en este orden: "estado de mi pedido" tiene que ganarle a "pedido".
const PALABRAS = [
  ['humano', /\b(humano|persona|alguien|asesor|operador|atienda|hablar con)\b/],
  ['estado', /\b(estado|mi pedido|donde esta|cuando (llega|viene|sale))\b/],
  ['promociones', /\b(promo|promos|promocion|promociones|oferta|ofertas|descuento)\b/],
  ['precios', /\b(precio|precios|cuesta|cuanto sale|lista)\b/],
  ['horarios', /\b(horario|horarios|hora|abren|cierran|ubicacion|direccion|donde estan|donde queda)\b/],
  ['pedido', /\b(pedido|pedir|encargar)\b/],
];

/**
 * Qué opción del menú eligió el cliente: el número ("2", "opción 2") o una palabra clave
 * ("a qué hora abren"). Devuelve el id o null si no se entiende.
 */
export const opcionDeMenu = (texto) => {
  const t = normalizarNombre(texto).replace(/[¡!¿?.,]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!t) return null;

  const numero = t.match(/^(?:opcion\s*)?(?:n(?:umero)?\s*)?([1-9])$/);
  if (numero) return OPCIONES_MENU.find((o) => o.numero === Number(numero[1]))?.id ?? null;

  const hallada = PALABRAS.find(([, re]) => re.test(t));
  return hallada ? hallada[0] : null;
};

/** Texto de la opción 2. La dirección y los horarios se pueden pisar desde la configuración. */
export const textoHorarios = ({ direccion = DIRECCION_DEFAULT, horarios = HORARIOS_DEFAULT } = {}) =>
  `Estamos en ${direccion}.\nAtendemos de ${horarios}`;

// ── Precios y promociones ───────────────────────────────────────────────────────────────

const plata = (n) => `$${Number(n).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;

/** "2026-11-17" → "17/11" */
const fechaCorta = (fecha) => {
  const [, m, d] = String(fecha || '').split('-');
  return m && d ? `${Number(d)}/${Number(m)}` : '';
};

/**
 * Lista de precios para mandar por WhatsApp. Solo los cortes disponibles y con precio.
 * `precios`: [{ corte, precioKg, disponible }]. `actualizado`: fecha YYYY-MM-DD.
 */
export const textoPrecios = (precios = [], actualizado = '') => {
  const lista = precios
    .filter((p) => p?.disponible !== false && Number(p?.precioKg) > 0 && p?.corte)
    .sort((a, b) => String(a.corte).localeCompare(String(b.corte), 'es'));
  if (lista.length === 0) return 'Por ahora no tenemos la lista de precios cargada. Te paso con una persona.';
  const cabecera = actualizado ? `Precios por kg (actualizados el ${fechaCorta(actualizado)}):` : 'Precios por kg:';
  return [cabecera, '', ...lista.map((p) => `• ${p.corte}: ${plata(p.precioKg)}`)].join('\n');
};

/**
 * Precio escrito a mano → número, o NaN si no sirve. Entiende "12500", "12.500", "12500,50" y "$ 12.500".
 * El punto con exactamente 3 dígitos después es de miles; la coma es decimal.
 */
export const parsearPrecio = (texto) => {
  let t = String(texto ?? '').replace(/[$\s]/g, '');
  if (!t || /[^\d.,]/.test(t)) return NaN;
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');
  const n = Number(t);
  return Number.isFinite(n) && n > 0 ? n : NaN;
};

/** Estado de una promoción para mostrarlo: 'apagada' | 'programada' | 'vencida' | 'vigente'. */
export const estadoPromocion = (promo, fecha) => {
  if (promo?.activa === false) return 'apagada';
  if (promo?.desde && fecha < promo.desde) return 'programada';
  if (promo?.hasta && fecha > promo.hasta) return 'vencida';
  return 'vigente';
};

/** ¿La promoción está activa y dentro de sus fechas (inclusive)? `fecha` es YYYY-MM-DD. */
export const promocionVigente = (promo, fecha) =>
  Boolean(promo)
  && promo.activa !== false
  && (!promo.desde || fecha >= promo.desde)
  && (!promo.hasta || fecha <= promo.hasta);

export const promocionesVigentes = (promos = [], fecha) =>
  promos.filter((p) => promocionVigente(p, fecha));

export const textoPromociones = (vigentes = []) => {
  if (vigentes.length === 0) return 'Por ahora no tenemos promociones.';
  return [
    'Promociones vigentes:',
    '',
    ...vigentes.map((p) => {
      const hasta = p.hasta ? ` (hasta el ${fechaCorta(p.hasta)})` : '';
      const detalle = p.descripcion ? `\n  ${p.descripcion}` : '';
      return `• ${p.titulo}${hasta}${detalle}`;
    }),
  ].join('\n');
};

// ── Estado del pedido ───────────────────────────────────────────────────────────────────

/** Frase para la opción 5 según el estado del último pedido. No promete horarios. */
export const textoEstadoPedido = (pedido) => {
  if (!pedido) return 'No encontramos un pedido tuyo reciente. Si querés hacer uno, escribí "menú".';
  const dia = fechaCorta(pedido.fecha);
  const del = dia ? ` del ${dia}` : '';
  switch (pedido.estado) {
    case 'pendiente': return `Tu pedido${del} está recibido y lo estamos preparando.`;
    case 'armado': return `Tu pedido${del} ya está armado y sale en el reparto.`;
    case 'entregado': return `Tu pedido${del} figura como entregado.`;
    default: return `Tu pedido${del} está en proceso. Si necesitás más detalle, escribí "6" y te atiende una persona.`;
  }
};

/** El último pedido de un cliente (por fecha y marca de tiempo). */
export const ultimoPedidoDe = (pedidos = [], clienteId) =>
  pedidos
    .filter((p) => p.clienteId === clienteId)
    .sort((a, b) => String(b.fecha + (b.timestamp || '')).localeCompare(String(a.fecha + (a.timestamp || ''))))[0] || null;
