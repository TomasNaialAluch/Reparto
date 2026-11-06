// Registro de mensajes de WhatsApp (enviados y recibidos). Colección `pedidos_mensajes`.
//
// saliente: programado → enviado → entregado → leido  (o fallido)
// entrante: nuevo → procesado (se pasó a pedido) | descartado
//
// Hoy los entrantes se cargan a mano para probar; cuando se conecte el proveedor,
// un webhook los escribe acá con `origen: 'whatsapp'` y la pantalla no cambia.
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  addDoc, collection, doc, limit, onSnapshot, orderBy, query, serverTimestamp, updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { getLocalDateString } from '../utils/date';

const COLECCION = 'pedidos_mensajes';

export const usePedidosMensajes = () => {
  const [mensajes, setMensajes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const q = query(collection(db, COLECCION), orderBy('creada', 'desc'), limit(300));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setMensajes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error al cargar mensajes de pedidos:', err);
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const entrantesNuevos = useMemo(
    () => mensajes.filter((m) => m.direccion === 'entrante' && m.estado === 'nuevo'),
    [mensajes]
  );

  const entrantesResueltos = useMemo(
    () => mensajes.filter((m) => m.direccion === 'entrante' && m.estado !== 'nuevo'),
    [mensajes]
  );

  const registrarMensaje = useCallback(async ({
    clienteId = null, cliente, direccion, texto, estado, origen = 'manual',
  }) => {
    const ref = await addDoc(collection(db, COLECCION), {
      clienteId,
      cliente: String(cliente || '').trim(),
      fecha: getLocalDateString(),
      direccion,
      texto: String(texto || '').trim(),
      estado,
      origen,
      pedidoId: null,
      creada: new Date().toISOString(),
      createdAt: serverTimestamp(),
    });
    return ref.id;
  }, []);

  const marcarProcesado = useCallback(async (mensajeId, pedidoId) => {
    await updateDoc(doc(db, COLECCION, mensajeId), { estado: 'procesado', pedidoId, updatedAt: serverTimestamp() });
  }, []);

  const descartar = useCallback(async (mensajeId) => {
    await updateDoc(doc(db, COLECCION, mensajeId), { estado: 'descartado', updatedAt: serverTimestamp() });
  }, []);

  return {
    mensajes, entrantesNuevos, entrantesResueltos, loading, error,
    registrarMensaje, marcarProcesado, descartar,
  };
};
