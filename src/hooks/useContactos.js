// Catálogo único de contactos (proveedores y/o clientes). Colección compartida `contactos`.
// Un contacto es UNA persona/empresa con roles; no hay "proveedor" y "cliente" por separado.
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  collection, addDoc, updateDoc, doc, onSnapshot, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { normalizarNombre, sonParecidos } from '../utils/nombres';

const COLECCION = 'contactos';

export const useContactos = () => {
  const [contactos, setContactos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, COLECCION),
      (snap) => {
        setContactos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error al cargar contactos:', err);
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const activos = useMemo(
    () => contactos
      .filter((c) => c.activo !== false)
      .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es')),
    [contactos]
  );

  const proveedores = useMemo(() => activos.filter((c) => c.roles?.proveedor), [activos]);

  /** Busca por nombre normalizado (también contempla alias). Incluye archivados. */
  const buscarExacto = useCallback((nombre) => {
    const clave = normalizarNombre(nombre);
    if (!clave) return null;
    return contactos.find(
      (c) => c.nombreNormalizado === clave
        || (c.alias || []).some((a) => normalizarNombre(a) === clave)
    ) || null;
  }, [contactos]);

  /** Contactos activos con nombre parecido (no igual): para avisar antes de crear. */
  const buscarParecidos = useCallback(
    (nombre) => activos.filter((c) => sonParecidos(c.nombre, nombre)),
    [activos]
  );

  /**
   * Crea un contacto o, si ya existe (incluso archivado), lo reutiliza:
   * lo reactiva y le suma los roles pedidos. Devuelve { id, nombre, creado }.
   */
  const crearContacto = useCallback(async (nombre, roles = { proveedor: true, cliente: true }) => {
    const limpio = String(nombre || '').trim().replace(/\s+/g, ' ');
    if (!limpio) throw new Error('El nombre es obligatorio');

    const existente = buscarExacto(limpio);
    if (existente) {
      const cambios = {};
      if (existente.activo === false) cambios.activo = true;
      Object.entries(roles).forEach(([rol, valor]) => {
        if (valor && !existente.roles?.[rol]) cambios[`roles.${rol}`] = true;
      });
      if (Object.keys(cambios).length) {
        await updateDoc(doc(db, COLECCION, existente.id), { ...cambios, updatedAt: serverTimestamp() });
      }
      return { id: existente.id, nombre: existente.nombre, creado: false };
    }

    const ref = await addDoc(collection(db, COLECCION), {
      nombre: limpio,
      nombreNormalizado: normalizarNombre(limpio),
      roles: { proveedor: !!roles.proveedor, cliente: !!roles.cliente },
      alias: [],
      activo: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: ref.id, nombre: limpio, creado: true };
  }, [buscarExacto]);

  /** Prende un rol en un contacto existente (ej. "también es proveedor"). */
  const agregarRol = useCallback(async (id, rol) => {
    await updateDoc(doc(db, COLECCION, id), { [`roles.${rol}`]: true, updatedAt: serverTimestamp() });
  }, []);

  /** Archiva: sale de los selectores pero conserva el historial. No se borra nunca. */
  const archivarContacto = useCallback(async (id) => {
    await updateDoc(doc(db, COLECCION, id), { activo: false, updatedAt: serverTimestamp() });
  }, []);

  /** Vuelve a dejar activo un contacto archivado. */
  const reactivarContacto = useCallback(async (id) => {
    await updateDoc(doc(db, COLECCION, id), { activo: true, updatedAt: serverTimestamp() });
  }, []);

  /**
   * Edita datos de un contacto. Si cambia el nombre se recalcula la clave normalizada
   * y se rechaza si choca con OTRO contacto. Devuelve { ok, motivo }.
   * Nota: las entradas ya cargadas conservan el nombre con el que se guardaron.
   */
  const actualizarContacto = useCallback(async (id, datos) => {
    const cambios = { updatedAt: serverTimestamp() };
    if (datos.nombre !== undefined) {
      const limpio = String(datos.nombre || '').trim().replace(/\s+/g, ' ');
      if (!limpio) return { ok: false, motivo: 'El nombre es obligatorio' };
      const otro = buscarExacto(limpio);
      if (otro && otro.id !== id) return { ok: false, motivo: `Ya existe un contacto llamado "${otro.nombre}"` };
      cambios.nombre = limpio;
      cambios.nombreNormalizado = normalizarNombre(limpio);
    }
    if (datos.roles) cambios.roles = { proveedor: !!datos.roles.proveedor, cliente: !!datos.roles.cliente };
    if (datos.alias) cambios.alias = datos.alias;
    if (datos.telefono !== undefined) cambios['contacto.telefono'] = String(datos.telefono || '').trim();
    if (datos.notas !== undefined) cambios.notas = String(datos.notas || '').trim();
    await updateDoc(doc(db, COLECCION, id), cambios);
    return { ok: true };
  }, [buscarExacto]);

  return {
    contactos, activos, proveedores, loading, error,
    buscarExacto, buscarParecidos, crearContacto, agregarRol,
    archivarContacto, reactivarContacto, actualizarContacto,
  };
};
