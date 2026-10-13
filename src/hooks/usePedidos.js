// Pedidos para armar del día. Colección compartida `pedidos`: un documento por pedido (cliente),
// con renglones de texto libre, como en el cuaderno ("12 b pata", "2 M").
//
// Estados: pendiente → armado (se tachan todos los renglones) → entregado.
// `origen` queda en 'manual' y deja lugar para 'whatsapp' (Twilio) sin migrar nada.
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  addDoc, collection, deleteDoc, doc, onSnapshot, query, runTransaction, serverTimestamp,
  updateDoc, where,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { generarIdPesada } from '../utils/pesadas';

const COLECCION = 'pedidos';

/** Estado que corresponde según los renglones (un pedido entregado no vuelve solo atrás). */
const estadoSegunRenglones = (estadoActual, renglones) => {
  if (estadoActual === 'entregado') return 'entregado';
  return renglones.length > 0 && renglones.every((r) => r.hecha) ? 'armado' : 'pendiente';
};

export const usePedidos = (fecha) => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, COLECCION), where('fecha', '==', fecha));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setDocs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error al cargar pedidos:', err);
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [fecha]);

  const pedidos = useMemo(
    () => [...docs].sort((a, b) => String(a.creada || '').localeCompare(String(b.creada || ''))),
    [docs]
  );

  const crearPedido = useCallback(async ({ cliente, clienteId = null }) => {
    const nombre = String(cliente || '').trim();
    if (!nombre) throw new Error('Falta el nombre');
    const ref = await addDoc(collection(db, COLECCION), {
      fecha,
      cliente: nombre,
      clienteId,
      renglones: [],
      estado: 'pendiente',
      origen: 'manual',
      notas: '',
      creada: new Date().toISOString(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  }, [fecha]);

  /** Modifica los renglones dentro de una transacción y recalcula el estado. */
  const editarRenglones = useCallback(async (pedidoId, transformar) => {
    const ref = doc(db, COLECCION, pedidoId);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) return;
      const datos = snap.data();
      const nuevos = transformar(datos.renglones || []);
      tx.update(ref, {
        renglones: nuevos,
        estado: estadoSegunRenglones(datos.estado, nuevos),
        updatedAt: serverTimestamp(),
      });
    });
  }, []);

  const agregarRenglon = useCallback((pedidoId, texto) => {
    const limpio = String(texto || '').trim();
    if (!limpio) return Promise.resolve();
    return editarRenglones(pedidoId, (r) => [...r, { id: generarIdPesada('lin'), texto: limpio, hecha: false }]);
  }, [editarRenglones]);

  const alternarRenglon = useCallback(
    (pedidoId, renglonId) => editarRenglones(
      pedidoId,
      (r) => r.map((x) => (x.id === renglonId ? { ...x, hecha: !x.hecha } : x))
    ),
    [editarRenglones]
  );

  const quitarRenglon = useCallback(
    (pedidoId, renglonId) => editarRenglones(pedidoId, (r) => r.filter((x) => x.id !== renglonId)),
    [editarRenglones]
  );

  const marcarEntregado = useCallback(async (pedidoId, entregado) => {
    const ref = doc(db, COLECCION, pedidoId);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) return;
      const renglones = snap.data().renglones || [];
      tx.update(ref, {
        estado: entregado ? 'entregado' : estadoSegunRenglones('pendiente', renglones),
        updatedAt: serverTimestamp(),
      });
    });
  }, []);

  const eliminarPedido = useCallback(async (pedidoId) => {
    await deleteDoc(doc(db, COLECCION, pedidoId));
  }, []);

  const renombrarPedido = useCallback(async (pedidoId, cliente) => {
    const nombre = String(cliente || '').trim();
    if (!nombre) return;
    await updateDoc(doc(db, COLECCION, pedidoId), { cliente: nombre, updatedAt: serverTimestamp() });
  }, []);

  return {
    pedidos, loading, error,
    crearPedido, agregarRenglon, alternarRenglon, quitarRenglon, marcarEntregado, eliminarPedido, renombrarPedido,
  };
};
