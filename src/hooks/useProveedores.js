// Hook personalizado para Proveedores
import { useState, useEffect } from 'react';
import { collection, addDoc, deleteDoc, doc, updateDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

export const useProveedores = () => {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const q = query(collection(db, 'proveedores'), orderBy('nombre', 'asc'));
      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const lista = [];
          querySnapshot.forEach((doc) => {
            lista.push({ id: doc.id, ...doc.data() });
          });
          setProveedores(lista);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Error al cargar proveedores:', err);
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

  const crearProveedor = async (nombre, contacto) => {
    try {
      const datos = {
        nombre: nombre.trim(),
        contacto: contacto.trim(),
        fechaCreacion: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, 'proveedores'), datos);
      return docRef.id;
    } catch (err) {
      console.error('Error al crear proveedor:', err);
      throw err;
    }
  };

  const actualizarProveedor = async (id, nombre, contacto) => {
    try {
      await updateDoc(doc(db, 'proveedores', id), {
        nombre: nombre.trim(),
        contacto: contacto.trim()
      });
    } catch (err) {
      console.error('Error al actualizar proveedor:', err);
      throw err;
    }
  };

  const eliminarProveedor = async (id) => {
    try {
      await deleteDoc(doc(db, 'proveedores', id));
    } catch (err) {
      console.error('Error al eliminar proveedor:', err);
      throw err;
    }
  };

  return {
    proveedores,
    loading,
    error,
    crearProveedor,
    actualizarProveedor,
    eliminarProveedor
  };
};


