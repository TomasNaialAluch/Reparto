// Agenda del día. Colección compartida `agenda`: un documento por tarea, con su fecha.
// Se guarda por fecha (no por semana), así el calendario puede abrir cualquier día.
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, updateDoc, where,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { horaEn, ordenarTareas } from '../utils/agenda';

const COLECCION = 'agenda';

/**
 * @param {string} fecha  día a mostrar (YYYY-MM-DD)
 * @param {{ anteriores?: boolean }} opciones  `anteriores`: también trae las pendientes de días previos
 */
export const useAgenda = (fecha, { anteriores = false } = {}) => {
  const [delDia, setDelDia] = useState([]);
  const [sinHacer, setSinHacer] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, COLECCION), where('fecha', '==', fecha));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setDelDia(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error('Error al cargar la agenda:', err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [fecha]);

  // Pendientes de cualquier día: un solo filtro de igualdad (sin índice); lo anterior se filtra acá.
  useEffect(() => {
    if (!anteriores) return undefined;
    const q = query(collection(db, COLECCION), where('hecha', '==', false));
    const unsub = onSnapshot(
      q,
      (snap) => setSinHacer(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => console.error('Error al cargar pendientes anteriores:', err)
    );
    return () => unsub();
  }, [anteriores]);

  const tareas = useMemo(() => ordenarTareas(delDia), [delDia]);
  const pendientesAnteriores = useMemo(
    () => sinHacer
      .filter((t) => t.fecha < fecha)
      .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)) || String(a.hora || '').localeCompare(String(b.hora || ''))),
    [sinHacer, fecha]
  );

  const agregarTarea = useCallback(async ({ texto, hora = null, alarma = null }) => {
    const limpio = String(texto || '').trim();
    if (!limpio) return null;
    const ref = await addDoc(collection(db, COLECCION), {
      fecha,
      hora: hora || null,
      texto: limpio,
      hecha: false,
      // Con hora, la alarma viene prendida por defecto
      alarma: alarma === null ? !!hora : !!alarma,
      avisadaAt: null,
      contactoId: null,
      creada: new Date().toISOString(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  }, [fecha]);

  const actualizar = useCallback(async (id, cambios) => {
    await updateDoc(doc(db, COLECCION, id), { ...cambios, updatedAt: serverTimestamp() });
  }, []);

  const alternarHecha = useCallback((id, hecha) => actualizar(id, { hecha }), [actualizar]);
  const alternarAlarma = useCallback((id, alarma) => actualizar(id, { alarma, avisadaAt: null }), [actualizar]);
  const marcarAvisada = useCallback((id) => actualizar(id, { avisadaAt: new Date().toISOString() }), [actualizar]);
  const posponer = useCallback(
    (id, minutos = 10) => actualizar(id, { hora: horaEn(minutos), alarma: true, avisadaAt: null }),
    [actualizar]
  );
  const moverAFecha = useCallback((id, nuevaFecha) => actualizar(id, { fecha: nuevaFecha }), [actualizar]);
  const eliminarTarea = useCallback(async (id) => { await deleteDoc(doc(db, COLECCION, id)); }, []);

  return {
    tareas, pendientesAnteriores, loading,
    agregarTarea, alternarHecha, alternarAlarma, marcarAvisada, posponer, moverAFecha, eliminarTarea,
  };
};
