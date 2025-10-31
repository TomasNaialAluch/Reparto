// Hook personalizado para Listas de Precios
import { useState, useEffect, useMemo } from 'react';
import { collection, addDoc, deleteDoc, doc, updateDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

export const useListasPrecios = () => {
  const [listas, setListas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const q = query(collection(db, 'listasPrecios'), orderBy('fecha', 'desc'));
      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const lista = [];
          querySnapshot.forEach((doc) => {
            lista.push({ id: doc.id, ...doc.data() });
          });
          setListas(lista);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Error al cargar listas de precios:', err);
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

  // Agrupar listas por nombre de prónelis para la comparación
  const pronelisAgrupadas = useMemo(() => {
    const agrupadas = {};
    listas.forEach(lista => {
      const nombre = lista.nombrePrónelis || lista.nombrePronelis || 'Sin nombre';
      if (!agrupadas[nombre]) {
        agrupadas[nombre] = [];
      }
      agrupadas[nombre].push(lista);
    });
    return agrupadas;
  }, [listas]);

  const crearLista = async (datos) => {
    try {
      const datosCompletos = {
        ...datos,
        fechaCreacion: datos.fechaCreacion || new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, 'listasPrecios'), datosCompletos);
      return docRef.id;
    } catch (err) {
      console.error('Error al crear lista:', err);
      throw err;
    }
  };

  const actualizarLista = async (id, datos) => {
    try {
      await updateDoc(doc(db, 'listasPrecios', id), {
        ...datos,
        fechaModificacion: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error al actualizar lista:', err);
      throw err;
    }
  };

  const eliminarLista = async (id) => {
    try {
      await deleteDoc(doc(db, 'listasPrecios', id));
    } catch (err) {
      console.error('Error al eliminar lista:', err);
      throw err;
    }
  };

  return {
    listas,
    pronelisAgrupadas,
    loading,
    error,
    crearLista,
    actualizarLista,
    eliminarLista
  };
};


