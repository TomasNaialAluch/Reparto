// Catálogo de cortes de mercadería. Colección compartida `cortes`.
// Un corte creado una vez queda disponible siempre; se archiva, no se borra.
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  collection, addDoc, updateDoc, doc, onSnapshot, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { normalizarNombre } from '../utils/nombres';

const COLECCION = 'cortes';

export const useCortes = () => {
  const [cortes, setCortes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, COLECCION),
      (snap) => {
        setCortes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error('Error al cargar cortes:', err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Orden estable: primero los base (en su orden), después el resto por nombre.
  const ordenados = useMemo(
    () => [...cortes].sort((a, b) => {
      if (!!a.base !== !!b.base) return a.base ? -1 : 1;
      if (a.base && b.base) return (a.orden ?? 0) - (b.orden ?? 0);
      return (a.nombre || '').localeCompare(b.nombre || '', 'es');
    }),
    [cortes]
  );
  const activos = useMemo(() => ordenados.filter((c) => c.activo !== false), [ordenados]);

  const buscarExacto = useCallback((nombre) => {
    const clave = normalizarNombre(nombre);
    if (!clave) return null;
    return cortes.find((c) => c.nombreNormalizado === clave) || null;
  }, [cortes]);

  /** Crea el corte o, si ya existe (aunque esté archivado), lo reactiva. Devuelve { nombre, creado }. */
  const crearCorte = useCallback(async (nombre, categoria = '') => {
    const limpio = String(nombre || '').trim().replace(/\s+/g, ' ');
    if (!limpio) throw new Error('El nombre es obligatorio');
    const existente = buscarExacto(limpio);
    if (existente) {
      if (existente.activo === false) {
        await updateDoc(doc(db, COLECCION, existente.id), { activo: true, updatedAt: serverTimestamp() });
      }
      return { id: existente.id, nombre: existente.nombre, creado: false };
    }
    const ref = await addDoc(collection(db, COLECCION), {
      nombre: limpio,
      nombreNormalizado: normalizarNombre(limpio),
      categoria: String(categoria || '').trim(),
      activo: true,
      base: false,
      orden: 1000 + cortes.length,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: ref.id, nombre: limpio, creado: true };
  }, [buscarExacto, cortes.length]);

  /** Cambia el nombre en el catálogo (las entradas ya cargadas conservan el que tenían). */
  const renombrarCorte = useCallback(async (id, nombre) => {
    const limpio = String(nombre || '').trim().replace(/\s+/g, ' ');
    if (!limpio) return { ok: false, motivo: 'El nombre es obligatorio' };
    const otro = buscarExacto(limpio);
    if (otro && otro.id !== id) return { ok: false, motivo: `Ya existe un corte llamado "${otro.nombre}"` };
    await updateDoc(doc(db, COLECCION, id), {
      nombre: limpio, nombreNormalizado: normalizarNombre(limpio), updatedAt: serverTimestamp(),
    });
    return { ok: true };
  }, [buscarExacto]);

  /** Categoría mayor del corte (Cerdo, Embutidos…). Texto libre; vacío = sin categoría. */
  const cambiarCategoria = useCallback(async (id, categoria) => {
    await updateDoc(doc(db, COLECCION, id), {
      categoria: String(categoria || '').trim().replace(/\s+/g, ' '), updatedAt: serverTimestamp(),
    });
  }, []);

  const categorias = useMemo(() => {
    const set = new Set();
    activos.forEach((c) => { if (c.categoria) set.add(c.categoria); });
    return [...set].sort((a, b) => a.localeCompare(b, 'es'));
  }, [activos]);

  const archivarCorte = useCallback(async (id) => {
    await updateDoc(doc(db, COLECCION, id), { activo: false, updatedAt: serverTimestamp() });
  }, []);

  const reactivarCorte = useCallback(async (id) => {
    await updateDoc(doc(db, COLECCION, id), { activo: true, updatedAt: serverTimestamp() });
  }, []);

  return {
    cortes: ordenados, activos, categorias, loading, buscarExacto,
    crearCorte, renombrarCorte, cambiarCategoria, archivarCorte, reactivarCorte,
  };
};
