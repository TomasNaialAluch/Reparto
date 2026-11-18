// Lectura de los datos que usa el bot (los mismos que se cargan desde Pedidos en la página).
// Se guardan un minuto en memoria para no leer Firestore en cada mensaje.
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (getApps().length === 0) initializeApp();
export const db = getFirestore();

const TTL_MS = 60_000;
let cache = { t: 0, valor: null };

const leer = async (coleccion) => (await db.collection(coleccion).get()).docs.map((d) => ({ id: d.id, ...d.data() }));

/** { cortes, precios, actualizado, promociones, faq, config } */
export const cargarCatalogo = async () => {
  if (cache.valor && Date.now() - cache.t < TTL_MS) return cache.valor;
  const [cortes, precios, promociones, faq, config] = await Promise.all([
    leer('cortes'),
    leer('pedidos_precios'),
    leer('pedidos_promociones'),
    leer('pedidos_faq'),
    db.collection('pedidos_config').doc('bot').get(),
  ]);
  const valor = {
    cortes: cortes.filter((c) => c.activo !== false),
    precios,
    actualizado: precios.reduce((max, p) => (p.actualizado > max ? p.actualizado : max), ''),
    promociones,
    faq,
    // direccion y horarios se pueden pisar desde `pedidos_config/bot`; si no, valen los de siempre
    config: config.exists ? config.data() : {},
  };
  cache = { t: Date.now(), valor };
  return valor;
};
