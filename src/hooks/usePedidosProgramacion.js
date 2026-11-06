// Programación de mensajes de WhatsApp por cliente. Colección `pedidos_programacion`:
// un documento por cliente, con el mismo id que el contacto, así guardar es siempre "pisar" el suyo.
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';

const COLECCION = 'pedidos_programacion';

export const usePedidosProgramacion = () => {
  const [programaciones, setProgramaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, COLECCION),
      (snap) => {
        setProgramaciones(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error al cargar la programación de pedidos:', err);
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const porCliente = useMemo(
    () => Object.fromEntries(programaciones.map((p) => [p.clienteId || p.id, p])),
    [programaciones]
  );

  /** { dias: [1, 4], hora: '08:30', mensaje: '...', activo: true } */
  const guardar = useCallback(async (clienteId, { cliente, dias, hora, mensaje, activo }) => {
    await setDoc(doc(db, COLECCION, clienteId), {
      clienteId,
      cliente,
      dias,
      hora,
      mensaje,
      activo,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }, []);

  const quitar = useCallback(async (clienteId) => {
    await deleteDoc(doc(db, COLECCION, clienteId));
  }, []);

  return { programaciones, porCliente, loading, error, guardar, quitar };
};
