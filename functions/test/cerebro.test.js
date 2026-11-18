import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TEXTOS, ahoraAR, estaAbierto, etiquetaDia, fechaDelPedido, responder,
} from '../src/cerebro.js';
import { normalizarNombre } from '../src/compartido/nombres.js';

const mk = (id, nombre, alias = []) => ({ id, nombre, nombreNormalizado: normalizarNombre(nombre), alias });
const cortes = [mk('a', 'Asado'), mk('v', 'Vacío'), mk('b', 'Bondiola'), mk('l', 'Lomo'), mk('c', 'Costilla'), mk('cl', 'Costeleta')];

// Martes 17/11/2026 a las 09:00 en Buenos Aires (12:00 UTC)
const MARTES_9 = new Date('2026-11-17T12:00:00Z');
const MARTES_13 = new Date('2026-11-17T16:00:00Z');

const deps = (extra = {}) => ({
  cortes,
  precios: [{ corte: 'Asado', precioKg: 9800, disponible: true }, { corte: 'Vacío', precioKg: 12500, disponible: true }],
  actualizado: '2026-11-17',
  promociones: [{ titulo: 'Asado x 5 kg', descripcion: '10% off', desde: '2026-11-01', hasta: '2026-11-30', activa: true }],
  faq: [{ tema: 'Envíos', respuesta: 'Hacemos envíos en la zona.', activa: true }],
  config: {},
  ultimoPedido: null,
  llm: async () => ({ respondible: true, respuesta: 'Sí, hacemos envíos en la zona.' }),
  ...extra,
});

const hablar = (texto, entrada = {}, d = deps()) => responder({ canal: 'web', estado: 'menu', texto, ahora: MARTES_9, ...entrada }, d);

// ── Hora y fecha ──
test('ahoraAR convierte a hora de Buenos Aires', () => {
  assert.deepEqual(ahoraAR(MARTES_9), { fecha: '2026-11-17', minutos: 540, dow: 2 });
  assert.equal(ahoraAR(new Date('2026-11-17T02:30:00Z')).fecha, '2026-11-16'); // 23:30 del día anterior
});

test('estaAbierto: lunes a sábado de 4 a 12', () => {
  assert.equal(estaAbierto({ minutos: 239, dow: 2 }), false);
  assert.equal(estaAbierto({ minutos: 240, dow: 2 }), true);
  assert.equal(estaAbierto({ minutos: 719, dow: 6 }), true);
  assert.equal(estaAbierto({ minutos: 720, dow: 2 }), false);
  assert.equal(estaAbierto({ minutos: 600, dow: 0 }), false);
});

test('fechaDelPedido: hasta las 12 hoy, después el próximo día de reparto', () => {
  assert.equal(fechaDelPedido({ fecha: '2026-11-17', minutos: 540, dow: 2 }), '2026-11-17');
  assert.equal(fechaDelPedido({ fecha: '2026-11-17', minutos: 180, dow: 2 }), '2026-11-17'); // madrugada: es de hoy
  assert.equal(fechaDelPedido({ fecha: '2026-11-17', minutos: 750, dow: 2 }), '2026-11-18');
  assert.equal(fechaDelPedido({ fecha: '2026-11-21', minutos: 780, dow: 6 }), '2026-11-23'); // sábado tarde: salta el domingo
  assert.equal(fechaDelPedido({ fecha: '2026-11-22', minutos: 600, dow: 0 }), '2026-11-23'); // domingo
});

test('etiquetaDia', () => {
  assert.equal(etiquetaDia('2026-11-17', '2026-11-17'), 'hoy');
  assert.equal(etiquetaDia('2026-11-18', '2026-11-17'), 'mañana');
  assert.equal(etiquetaDia('2026-11-23', '2026-11-21'), 'el lunes');
});

// ── Menú y opciones ──
test('saludo muestra el menú', async () => {
  for (const t of ['hola', 'Buen día', 'menú', 'MENU', 'ayuda']) {
    const r = await hablar(t);
    assert.equal(r.estado, 'menu', t);
    assert.match(r.respuestas[0], /6\. Hablar con una persona/, t);
  }
});

test('opción 2: horarios y dirección', async () => {
  const r = await hablar('2');
  assert.match(r.respuestas[0], /José E\. Rodó 6341/);
  assert.match(r.respuestas[0], /4 a 12 hs/);
});

test('opción 3: precios solo de lo disponible', async () => {
  const r = await hablar('3');
  assert.match(r.respuestas[0], /Asado: \$9\.800/);
  assert.match(r.respuestas[0], /Vacío: \$12\.500/);
});

test('opción 4: promociones vigentes', async () => {
  assert.match((await hablar('4')).respuestas[0], /Asado x 5 kg/);
  const sin = await hablar('4', {}, deps({ promociones: [] }));
  assert.match(sin.respuestas[0], /Por ahora no tenemos promociones/);
});

test('opción 5: sin identificar y con pedido', async () => {
  assert.equal((await hablar('5')).respuestas[0], TEXTOS.sinIdentificar);
  const r = await hablar('5', { identificado: true }, deps({ ultimoPedido: { estado: 'armado', fecha: '2026-11-17' } }));
  assert.match(r.respuestas[0], /ya está armado/);
});

test('opción 6: pasa a humano', async () => {
  const r = await hablar('6');
  assert.equal(r.estado, 'humano');
  assert.deepEqual(r.accion, { tipo: 'humano', motivo: 'pidio' });
});

test('opción inexistente vuelve al menú', async () => {
  const r = await hablar('9');
  assert.equal(r.estado, 'menu');
  assert.match(r.respuestas[0], /no existe/);
});

test('palabras clave: "a qué hora abren" y "precios"', async () => {
  assert.match((await hablar('a qué hora abren?')).respuestas[0], /4 a 12 hs/);
  assert.match((await hablar('pasame los precios')).respuestas[0], /Asado/);
});

// ── Pedido ──
test('opción 1 pide el pedido', async () => {
  const r = await hablar('1');
  assert.equal(r.estado, 'pedido');
  assert.equal(r.respuestas[0], TEXTOS.pedirPedido);
});

test('pedido claro pide confirmación y guarda lo pendiente', async () => {
  const r = await hablar('10 kg asado, 5 kg vacío');
  assert.equal(r.estado, 'confirmando');
  assert.deepEqual(r.pendiente, { renglones: ['10 Asado', '5 Vacío'], fecha: '2026-11-17' });
  assert.match(r.respuestas[0], /Anoté para hoy:\n10 kg Asado\n5 kg Vacío/);
  assert.doesNotMatch(r.respuestas[0], /cerrados/);
});

test('confirmar con 1 o "sí" crea el pedido', async () => {
  const pendiente = { renglones: ['10 Asado'], fecha: '2026-11-17' };
  for (const t of ['1', 'si', 'Sí', 'dale']) {
    const r = await hablar(t, { estado: 'confirmando', pendiente });
    assert.equal(r.accion.tipo, 'crearPedido', t);
    assert.deepEqual(r.accion.renglones, ['10 Asado']);
    assert.equal(r.estado, 'menu');
  }
});

test('corregir vuelve a pedir', async () => {
  const r = await hablar('2', { estado: 'confirmando', pendiente: { renglones: ['10 Asado'], fecha: '2026-11-17' } });
  assert.equal(r.estado, 'pedido');
});

test('pedido fuera de horario avisa y va al día siguiente', async () => {
  const r = await hablar('10 kg asado', { ahora: MARTES_13 });
  assert.match(r.respuestas[0], /Anoté para mañana/);
  assert.match(r.respuestas[0], /Ahora estamos cerrados/);
  assert.equal(r.pendiente.fecha, '2026-11-18');
});

test('pedido con corte dudoso o sin kilos no se crea solo', async () => {
  for (const t of ['2 kg picaña', '5 kg lomo, vacío', '3 kg cost']) {
    const r = await hablar(t);
    assert.equal(r.accion?.tipo, 'revisar', t);
    assert.equal(r.estado, 'menu');
    assert.equal(r.respuestas[0], TEXTOS.revisar);
  }
});

test('en estado pedido: "hoy no", texto sin kilos y volver al menú', async () => {
  assert.equal((await hablar('hoy no', { estado: 'pedido' })).respuestas[0], TEXTOS.sinPedido);
  assert.equal((await hablar('asado', { estado: 'pedido' })).respuestas[0], TEXTOS.noEntendi);
  assert.equal((await hablar('menú', { estado: 'pedido' })).estado, 'menu');
});

test('"hoy no sé qué pedir" no se toma como "hoy no pido nada"', async () => {
  const r = await hablar('hoy no sé qué pedir', { estado: 'pedido' });
  assert.equal(r.estado, 'pedido');
  assert.equal(r.respuestas[0], TEXTOS.noEntendi);
});

test('confirmando con basura repite la pregunta', async () => {
  const pendiente = { renglones: ['10 Asado'], fecha: '2026-11-17' };
  const r = await hablar('quizás', { estado: 'confirmando', pendiente });
  assert.equal(r.estado, 'confirmando');
  assert.deepEqual(r.pendiente, pendiente);
});

test('corregir mandando otro pedido directamente', async () => {
  const r = await hablar('8 kg lomo', { estado: 'confirmando', pendiente: { renglones: ['10 Asado'], fecha: '2026-11-17' } });
  assert.equal(r.estado, 'confirmando');
  assert.deepEqual(r.pendiente.renglones, ['8 Lomo']);
});

// ── Baja, audios, humano ──
test('BAJA', async () => {
  const r = await hablar('BAJA');
  assert.equal(r.accion.tipo, 'baja');
});

test('audio e imagen', async () => {
  assert.equal((await hablar('', { media: 'audio' })).respuestas[0], TEXTOS.audio);
  assert.equal((await hablar('', { media: 'imagen', estado: 'pedido' })).estado, 'pedido');
});

test('con una persona atendiendo, WhatsApp se calla y la prueba web puede volver', async () => {
  const wa = await hablar('hola', { canal: 'whatsapp', estado: 'humano' });
  assert.deepEqual(wa.respuestas, []);
  assert.equal(wa.estado, 'humano');
  const web = await hablar('menú', { canal: 'web', estado: 'humano' });
  assert.equal(web.estado, 'menu');
});

test('BAJA se respeta aunque haya una persona atendiendo', async () => {
  assert.equal((await hablar('baja', { canal: 'whatsapp', estado: 'humano' })).accion.tipo, 'baja');
});

// ── Texto libre con IA ──
test('pregunta cargada: contesta la IA', async () => {
  const r = await hablar('me mandan la mercadería al local?');
  assert.equal(r.accion.tipo, 'ia');
  assert.equal(r.respuestas[0], 'Sí, hacemos envíos en la zona.');
  assert.equal(r.respuestas[1], TEXTOS.menuAbajo);
});

test('si la IA no sabe, pasa a una persona', async () => {
  const r = await hablar('hacen asado para 200 personas?', {}, deps({ llm: async () => ({ respondible: false, respuesta: '' }) }));
  assert.equal(r.estado, 'humano');
  assert.equal(r.accion.motivo, 'sinRespuesta');
  assert.equal(r.respuestas[0], TEXTOS.sinDato);
});

test('si la IA falla o devuelve basura, pasa a una persona y no inventa', async () => {
  for (const llm of [async () => { throw new Error('caída'); }, async () => null, async () => ({ respondible: 'si' }), async () => ({ respondible: true, respuesta: '  ' })]) {
    const r = await hablar('tienen pollo?', {}, deps({ llm }));
    assert.equal(r.estado, 'humano');
    assert.equal(r.respuestas[0], TEXTOS.sinDato);
  }
});

test('sin preguntas frecuentes cargadas ni se llama a la IA', async () => {
  let llamadas = 0;
  const r = await hablar('tienen pollo?', {}, deps({ faq: [], llm: async () => { llamadas += 1; return null; } }));
  assert.equal(llamadas, 0);
  assert.equal(r.estado, 'humano');
});

test('las preguntas apagadas no se le pasan a la IA', async () => {
  let recibidas = null;
  await hablar('hola qué tal, hacen envíos?', {}, deps({
    faq: [{ tema: 'Envíos', respuesta: 'Sí.', activa: true }, { tema: 'Viejo', respuesta: 'No va', activa: false }],
    llm: async ({ faq }) => { recibidas = faq; return { respondible: true, respuesta: 'Sí.' }; },
  }));
  assert.deepEqual(recibidas.map((f) => f.tema), ['Envíos']);
});

test('un saludo con una pregunta es una pregunta, no solo un saludo', async () => {
  const r = await hablar('hola, hacen envíos?');
  assert.equal(r.accion?.tipo, 'ia');
  assert.equal((await hablar('hola, buen día, qué tal')).estado, 'menu');
});

test('"quiero saber..." no se confunde con hacer un pedido', async () => {
  const r = await hablar('quiero saber si hacen envíos');
  assert.equal(r.accion?.tipo, 'ia');
  assert.equal((await hablar('quiero hacer un pedido')).estado, 'pedido');
});

test('una pregunta larga con palabras del menú va a las preguntas frecuentes', async () => {
  const r = await hablar('me podrías decir a qué hora llega el reparto a mi barrio por favor');
  assert.equal(r.accion?.tipo, 'ia');
});

test('texto vacío muestra el menú', async () => {
  assert.equal((await hablar('   ')).estado, 'menu');
});

test('un mensaje larguísimo no rompe nada', async () => {
  const r = await hablar('a'.repeat(5000));
  assert.ok(Array.isArray(r.respuestas));
});
