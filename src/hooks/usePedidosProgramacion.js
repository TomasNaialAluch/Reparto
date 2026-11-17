// Programación de mensajes de WhatsApp por cliente. Colección `pedidos_programacion`:
// un documento por cliente, con el mismo id que el contacto, así guardar es siempre "pisar" el suyo.
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  arrayRemove, arrayUnion, collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc, updateDoc, writeBatch,
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

  /**
   * Formato original: { dias: [1, 4], hora: '08:30', mensaje: '...', activo: true }.
   * Formato nuevo (opcional): `envios: [{ id, dias, hora, plantillaId }]`, `consentimiento`,
   * `pausadoHasta: 'YYYY-MM-DD'` y `saltear: ['YYYY-MM-DD']`. Solo se escribe lo que viene.
   */
  const guardar = useCallback(async (clienteId, datos) => {
    const limpios = Object.fromEntries(Object.entries(datos).filter(([, v]) => v !== undefined));
    await setDoc(doc(db, COLECCION, clienteId), {
      clienteId,
      ...limpios,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }, []);

  const quitar = useCallback(async (clienteId) => {
    await deleteDoc(doc(db, COLECCION, clienteId));
  }, []);

  /** Aplica los mismos cambios a varios clientes de una vez (una sola escritura). */
  const aplicarAVarios = useCallback(async (clienteIds, cambios) => {
    const limpios = Object.fromEntries(Object.entries(cambios).filter(([, v]) => v !== undefined));
    const lote = writeBatch(db);
    clienteIds.forEach((id) => {
      lote.set(doc(db, COLECCION, id), { clienteId: id, ...limpios, updatedAt: serverTimestamp() }, { merge: true });
    });
    await lote.commit();
  }, []);

  /** Saltea un día puntual (YYYY-MM-DD) sin tocar el resto de la programación. */
  const saltear = useCallback(
    (clienteId, fecha) => updateDoc(doc(db, COLECCION, clienteId), { saltear: arrayUnion(fecha), updatedAt: serverTimestamp() }),
    []
  );

  /** Vuelve a incluir un día que se había salteado. */
  const dejarDeSaltear = useCallback(
    (clienteId, fecha) => updateDoc(doc(db, COLECCION, clienteId), { saltear: arrayRemove(fecha), updatedAt: serverTimestamp() }),
    []
  );

  return {
    programaciones, porCliente, loading, error, guardar, quitar, aplicarAVarios, saltear, dejarDeSaltear,
  };
};
