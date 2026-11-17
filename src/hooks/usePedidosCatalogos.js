// Datos que el bot de WhatsApp lee para contestar, y que se cargan desde Pedidos:
//   pedidos_precios      → un documento por corte (id = id del corte, así guardar es "pisar" el suyo)
//   pedidos_promociones  → una por documento, con fechas de vigencia
//   pedidos_faq          → preguntas frecuentes que la IA puede usar (y nada más que eso)
// Diseño: README-PEDIDOS-BOT.md, secciones 4, 4 bis y 4 ter.
import { useCallback, useEffect, useState } from 'react';
import {
  addDoc, collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc, updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { getLocalDateString } from '../utils/date';

/** Firestore no acepta `undefined`: se descartan esos campos. */
const sinUndefined = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

const useColeccion = (nombre) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, nombre),
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(`Error al cargar ${nombre}:`, err);
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [nombre]);

  /** Crea (sin id) o actualiza (con id) un documento. Devuelve el id. */
  const guardar = useCallback(async (datos, id = null) => {
    const base = sinUndefined({ ...datos, updatedAt: serverTimestamp() });
    if (id) {
      await setDoc(doc(db, nombre, id), base, { merge: true });
      return id;
    }
    const ref = await addDoc(collection(db, nombre), { ...base, createdAt: serverTimestamp() });
    return ref.id;
  }, [nombre]);

  const quitar = useCallback((id) => deleteDoc(doc(db, nombre, id)), [nombre]);

  const actualizar = useCallback(
    (id, cambios) => updateDoc(doc(db, nombre, id), sinUndefined({ ...cambios, updatedAt: serverTimestamp() })),
    [nombre]
  );

  return { items, loading, error, guardar, quitar, actualizar };
};

/** { corte, precioKg, disponible, actualizado } — el id del documento es el id del corte. */
export const usePedidosPrecios = () => {
  const { items, loading, error, guardar, quitar } = useColeccion('pedidos_precios');

  const guardarPrecio = useCallback(
    (corteId, { corte, precioKg, disponible = true }) =>
      guardar({ corte, precioKg: Number(precioKg), disponible, actualizado: getLocalDateString() }, corteId),
    [guardar]
  );

  /** Fecha de la última actualización (la más reciente de la lista), para mostrarla al cliente. */
  const actualizado = items.reduce((max, p) => (p.actualizado > max ? p.actualizado : max), '');

  return { precios: items, actualizado, loading, error, guardarPrecio, quitarPrecio: quitar };
};

/** { titulo, descripcion, desde, hasta, activa } — `desde`/`hasta` en YYYY-MM-DD, ambos opcionales. */
export const usePedidosPromociones = () => {
  const { items, loading, error, guardar, quitar, actualizar } = useColeccion('pedidos_promociones');

  const guardarPromocion = useCallback(
    ({ titulo, descripcion = '', desde = '', hasta = '', activa = true }, id = null) =>
      guardar({ titulo: String(titulo || '').trim(), descripcion: String(descripcion).trim(), desde, hasta, activa }, id),
    [guardar]
  );

  const activar = useCallback((id, activa) => actualizar(id, { activa }), [actualizar]);

  return { promociones: items, loading, error, guardarPromocion, quitarPromocion: quitar, activar };
};

/** { tema, respuesta, activa }: lo único que la IA puede usar para contestar texto libre. */
export const usePedidosFaq = () => {
  const { items, loading, error, guardar, quitar, actualizar } = useColeccion('pedidos_faq');

  const guardarFaq = useCallback(
    ({ tema, respuesta, activa = true }, id = null) =>
      guardar({ tema: String(tema || '').trim(), respuesta: String(respuesta || '').trim(), activa }, id),
    [guardar]
  );

  const activar = useCallback((id, activa) => actualizar(id, { activa }), [actualizar]);

  return { faq: items, loading, error, guardarFaq, quitarFaq: quitar, activar };
};
