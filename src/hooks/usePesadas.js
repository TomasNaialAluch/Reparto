// Pesadas de balanza del día. Colección compartida `pesadas`: un documento por pesada
// (un camión / proveedor) con el detalle de cada pesada individual.
//
// Cada kg se agrega con arrayUnion y se quita con arrayRemove, así dos personas
// pesando a la vez no se pisan (no se reescribe la lista completa).
// La validación de textos sin reconocer sí reescribe la lista, pero dentro de una transacción.
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where,
  arrayUnion, arrayRemove, runTransaction, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { normalizarNombre } from '../utils/nombres';
import { diaDeFecha, estaResuelto, generarIdPesada, horaActual, redondearKg } from '../utils/pesadas';

const COLECCION = 'pesadas';

export const usePesadas = (fecha) => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    // Un solo filtro de igualdad: no necesita índice compuesto.
    const q = query(collection(db, COLECCION), where('fecha', '==', fecha));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setDocs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error al cargar pesadas:', err);
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [fecha]);

  // Orden estable: por orden de creación (la más vieja primero).
  const pesadas = useMemo(
    () => [...docs].sort((a, b) => String(a.creada || '').localeCompare(String(b.creada || ''))),
    [docs]
  );

  const crearPesada = useCallback(async ({ proveedor, proveedorId = null, remitoNumero = '' }) => {
    const nombre = String(proveedor || '').trim();
    if (!nombre) throw new Error('Falta el proveedor');
    const ref = await addDoc(collection(db, COLECCION), {
      fecha,
      dia: diaDeFecha(fecha),
      proveedor: nombre,
      proveedorId,
      remito: { numero: String(remitoNumero || '').trim() },
      pesadas: [],
      estado: 'abierta',
      creada: new Date().toISOString(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  }, [fecha]);

  /**
   * Agrega una pesada individual. Guarda siempre lo que se escribió (`texto`) y, si se
   * reconoció, el corte del catálogo (`corteId` / `corte`).
   */
  const agregarKg = useCallback(async (pesadaId, { texto, corteId = null, corte = null, kg, match, candidatos = [] }) => {
    const item = {
      id: generarIdPesada('kg'),
      texto: String(texto || '').trim(),
      corteId,
      corte,
      kg: redondearKg(kg),
      hora: horaActual(),
      match: match || (corteId ? 'exacto' : 'nuevo'),
    };
    if (candidatos.length > 0) item.candidatos = candidatos;
    await updateDoc(doc(db, COLECCION, pesadaId), {
      pesadas: arrayUnion(item),
      updatedAt: serverTimestamp(),
    });
    return item;
  }, []);

  /** `item` es el objeto tal como está guardado (arrayRemove compara el valor completo). */
  const quitarKg = useCallback(async (pesadaId, item) => {
    await updateDoc(doc(db, COLECCION, pesadaId), {
      pesadas: arrayRemove(item),
      updatedAt: serverTimestamp(),
    });
  }, []);

  /**
   * Aplica una decisión a TODAS las pesadas sin validar que tengan ese texto
   * (comparado normalizado). Dentro de una transacción para no pisar cargas simultáneas.
   */
  const resolverTexto = useCallback(async (pesadaId, textoNorm, { corteId, corte }) => {
    const ref = doc(db, COLECCION, pesadaId);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) return;
      const actuales = snap.data().pesadas || [];
      const nuevas = actuales.map((it) => {
        if (estaResuelto(it)) return it;
        if (normalizarNombre(it.texto || it.corte) !== textoNorm) return it;
        const { candidatos: _descartado, ...resto } = it;
        return { ...resto, corteId, corte, match: 'validado' };
      });
      tx.update(ref, { pesadas: nuevas, updatedAt: serverTimestamp() });
    });
  }, []);

  /** Marca la pesada como ya pasada a Mercadería y guarda el vínculo. */
  const marcarIngresada = useCallback(async (pesadaId, mercaderiaId) => {
    await updateDoc(doc(db, COLECCION, pesadaId), {
      estado: 'ingresada',
      mercaderiaId,
      ingresadaAt: new Date().toISOString(),
      updatedAt: serverTimestamp(),
    });
  }, []);

  /** Solo para pesadas sin kg cargados (creadas por error). */
  const eliminarPesadaVacia = useCallback(async (pesadaId) => {
    await deleteDoc(doc(db, COLECCION, pesadaId));
  }, []);

  return {
    pesadas, loading, error,
    crearPesada, agregarKg, quitarKg, resolverTexto, marcarIngresada, eliminarPesadaVacia,
  };
};
