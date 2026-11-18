// Chat de prueba de la página del negocio: el mismo bot que va a atender WhatsApp, para probarlo
// mientras Meta termina de verificar. NO crea pedidos de verdad (los simula) y tiene límites de uso,
// porque cualquiera que abra la página puede escribirle. Se llama desde la página en /api/chat.
import { logger } from 'firebase-functions';
import { onRequest } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';
import { ahoraAR, responder } from './cerebro.js';
import { REGION } from './config.js';
import { cargarCatalogo, db } from './datos.js';
import { crearLlm, listarModelos } from './llm.js';

const MAX_POR_HORA = 40;
const MAX_POR_DIA = 1000;
const MAX_HISTORIAL = 20;
const SESION_VALIDA = /^[A-Za-z0-9_-]{8,64}$/;

const gemini = crearLlm({
  alUsarModelo: (modelo) => logger.info('Gemini: modelo en uso', { modelo }),
  alFallar: (intento) => logger.warn('Gemini: intento fallido', intento),
});

/** Igual que Gemini, pero deja constancia de por qué falló (sin el texto del cliente). */
const llm = async (entrada) => {
  try {
    const salida = await gemini(entrada);
    if (!salida) logger.warn('Gemini devolvió una salida que no sirve', { preguntas: entrada.faq.length });
    return salida;
  } catch (error) {
    logger.error('Gemini falló', { mensaje: error?.message, codigo: error?.status || error?.code });
    if ((error?.status || error?.code) === 404) {
      // El modelo configurado no existe en este proyecto: se deja en el registro cuáles sí hay.
      try {
        logger.warn('Modelos Gemini disponibles', { modelos: await listarModelos() });
      } catch (e) {
        logger.warn('No se pudo listar los modelos', { mensaje: e?.message });
      }
    }
    throw error;
  }
};

/** Cuenta el mensaje contra el límite de la sesión por hora y el límite general por día. */
const registrarUso = async (sesion, reloj) => {
  const hora = `${reloj.fecha.replaceAll('-', '')}${String(Math.floor(reloj.minutos / 60)).padStart(2, '0')}`;
  const refSesion = db.collection('pedidos_limites').doc(`web_${sesion}_${hora}`);
  const refDia = db.collection('pedidos_limites').doc(`web_dia_${reloj.fecha.replaceAll('-', '')}`);
  return db.runTransaction(async (tx) => {
    const [s, d] = await Promise.all([tx.get(refSesion), tx.get(refDia)]);
    const usoSesion = (s.data()?.n || 0) + 1;
    const usoDia = (d.data()?.n || 0) + 1;
    if (usoSesion > MAX_POR_HORA) return 'sesion';
    if (usoDia > MAX_POR_DIA) return 'dia';
    tx.set(refSesion, { n: usoSesion, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    tx.set(refDia, { n: usoDia, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return null;
  });
};

export const chatWeb = onRequest(
  { region: REGION, memory: '256MiB', timeoutSeconds: 30, maxInstances: 5, invoker: 'public' },
  async (req, res) => {
    res.set('Cache-Control', 'no-store');
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Usá POST.' });
      return;
    }
    const { sesion, texto } = req.body || {};
    if (!SESION_VALIDA.test(String(sesion || '')) || typeof texto !== 'string' || !texto.trim() || texto.length > 500) {
      res.status(400).json({ error: 'Mensaje no válido.' });
      return;
    }

    try {
      const ahora = new Date();
      const reloj = ahoraAR(ahora);
      const bloqueo = await registrarUso(sesion, reloj);
      if (bloqueo) {
        res.status(429).json({
          respuestas: [bloqueo === 'sesion'
            ? 'Escribiste muchos mensajes seguidos. Esperá un rato y seguimos.'
            : 'El chat de prueba llegó al límite de hoy. Probá de nuevo mañana.'],
          estado: 'menu',
        });
        return;
      }

      const refConversacion = db.collection('pedidos_conversaciones').doc(`web_${sesion}`);
      const previa = (await refConversacion.get()).data() || {};
      const catalogo = await cargarCatalogo();

      const salida = await responder(
        { canal: 'web', estado: previa.estado, pendiente: previa.pendiente, texto, ahora, identificado: false },
        { ...catalogo, ultimoPedido: null, llm }
      );

      const respuestas = [...salida.respuestas];
      if (salida.accion?.tipo === 'crearPedido' && respuestas.length > 0) {
        respuestas[respuestas.length - 1] += '\n\n(Modo prueba: este pedido NO se guardó de verdad.)';
      }

      const historial = [
        ...(previa.historial || []),
        { de: 'cliente', texto: texto.trim(), en: ahora.toISOString() },
        ...respuestas.map((r) => ({ de: 'bot', texto: r, en: ahora.toISOString() })),
      ].slice(-MAX_HISTORIAL);

      await refConversacion.set({
        canal: 'web',
        estado: salida.estado,
        pendiente: salida.pendiente || null,
        historial,
        ultimoEntrante: ahora.toISOString(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      res.status(200).json({ respuestas, estado: salida.estado });
    } catch (error) {
      // Nunca se devuelve el detalle del error al visitante.
      logger.error('chatWeb falló', { mensaje: error?.message });
      res.status(500).json({ respuestas: ['Tuve un problema técnico. Probá de nuevo en un momento.'], estado: 'menu' });
    }
  }
);
