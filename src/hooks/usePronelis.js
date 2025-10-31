// Hook personalizado para Prónelis/Paquetes
import { useState, useEffect } from 'react';
import { collection, addDoc, deleteDoc, doc, updateDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

export const usePronelis = () => {
  const [pronelis, setPronelis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const q = query(collection(db, 'pronelis'), orderBy('nombre', 'asc'));
      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const lista = [];
          querySnapshot.forEach((doc) => {
            lista.push({ id: doc.id, ...doc.data() });
          });
          setPronelis(lista);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Error al cargar prónelis:', err);
          setError(err.message);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.error('Error al configurar listener:', err);
      setError(err.message);
      setLoading(false);
    }
  }, []);

  const crearPronelis = async (nombre, productos) => {
    try {
      const datos = {
        nombre: nombre.trim(),
        productos: productos.map(p => ({ nombre: p.nombre.trim() })),
        fechaCreacion: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, 'pronelis'), datos);
      return docRef.id;
    } catch (err) {
      console.error('Error al crear prónelis:', err);
      throw err;
    }
  };

  const actualizarPronelis = async (id, nombre, productos) => {
    try {
      await updateDoc(doc(db, 'pronelis', id), {
        nombre: nombre.trim(),
        productos: productos.map(p => ({ nombre: p.nombre.trim() }))
      });
    } catch (err) {
      console.error('Error al actualizar prónelis:', err);
      throw err;
    }
  };

  const eliminarPronelis = async (id) => {
    try {
      await deleteDoc(doc(db, 'pronelis', id));
    } catch (err) {
      console.error('Error al eliminar prónelis:', err);
      throw err;
    }
  };

  return {
    pronelis,
    loading,
    error,
    crearPronelis,
    actualizarPronelis,
    eliminarPronelis
  };
};


