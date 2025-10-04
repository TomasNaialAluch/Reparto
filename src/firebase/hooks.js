// Firebase Hooks for React
import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  onSnapshot 
} from 'firebase/firestore';
import { db } from './config';

// Hook para operaciones CRUD genéricas
export const useFirestore = (collectionName) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para agregar documento
  const addDocument = async (data) => {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Función para actualizar documento
  const updateDocument = async (docId, data) => {
    try {
      await updateDoc(doc(db, collectionName, docId), {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Función para eliminar documento
  const deleteDocument = async (docId) => {
    try {
      await deleteDoc(doc(db, collectionName, docId));
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Función para obtener documentos con filtro
  const getDocumentsByField = async (field, value) => {
    try {
      const q = query(
        collection(db, collectionName),
        where(field, '==', value),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const docs = [];
      querySnapshot.forEach((doc) => {
        docs.push({
          id: doc.id,
          ...doc.data()
        });
      });
      return docs;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  return {
    documents,
    loading,
    error,
    addDocument,
    updateDocument,
    deleteDocument,
    getDocumentsByField
  };
};

// Hook para escuchar cambios en tiempo real
export const useFirestoreRealtime = (collectionName, orderField = 'createdAt') => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const q = query(collection(db, collectionName), orderBy(orderField, 'desc'));
    
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const docs = [];
        querySnapshot.forEach((doc) => {
          docs.push({
            id: doc.id,
            ...doc.data()
          });
        });
        setDocuments(docs);
        setLoading(false);
      },
      (error) => {
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, orderField]);

  return { documents, loading, error };
};

// Hook específico para repartos
export const useRepartos = () => {
  const { documents, loading, error, addDocument, updateDocument, deleteDocument, getDocumentsByField } = useFirestore('repartos');

  const addReparto = async (clientData) => {
    try {
      // Validar datos antes de agregar
      if (!clientData.clientName?.trim()) {
        throw new Error('El nombre del cliente es requerido');
      }
      if (!clientData.billAmount || clientData.billAmount <= 0) {
        throw new Error('El monto debe ser mayor a 0');
      }

      return await addDocument({
        clientName: clientData.clientName.trim(),
        billAmount: parseFloat(clientData.billAmount),
        address: clientData.address || '',
        paymentStatus: clientData.paymentStatus || 'pending',
        paymentAmount: clientData.paymentAmount || 0,
        date: clientData.date || new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Error en addReparto:', error);
      throw error;
    }
  };

  const updatePayment = async (repartoId, paymentStatus, paymentAmount = 0) => {
    try {
      if (!repartoId) {
        throw new Error('ID de reparto requerido');
      }

      return await updateDocument(repartoId, {
        paymentStatus,
        paymentAmount: parseFloat(paymentAmount),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error en updatePayment:', error);
      throw error;
    }
  };

  const getRepartosByDate = async (date) => {
    try {
      return await getDocumentsByField('date', date);
    } catch (error) {
      console.error('Error en getRepartosByDate:', error);
      throw error;
    }
  };

  // Filtrar repartos del día actual
  const todayRepartos = documents.filter(reparto => 
    reparto.date === new Date().toISOString().split('T')[0]
  );

  return {
    repartos: documents,
    todayRepartos,
    loading,
    error,
    addReparto,
    updatePayment,
    deleteReparto: deleteDocument,
    getRepartosByDate
  };
};

// Hook específico para saldos de clientes
export const useClientBalances = () => {
  const { documents, loading, error, addDocument, updateDocument, deleteDocument } = useFirestore('clientBalances');

  const addClientBalance = async (clientData) => {
    return await addDocument({
      clientName: clientData.clientName,
      boletas: clientData.boletas || [],
      ventas: clientData.ventas || [],
      plataFavor: clientData.plataFavor || [],
      efectivo: clientData.efectivo || [],
      cheques: clientData.cheques || [],
      transferencias: clientData.transferencias || [],
      finalBalance: clientData.finalBalance,
      date: new Date().toISOString().split('T')[0]
    });
  };

  return {
    balances: documents,
    loading,
    error,
    addClientBalance,
    updateBalance: updateDocument,
    deleteBalance: deleteDocument
  };
};

// Hook específico para transferencias
export const useTransfers = () => {
  const { documents, loading, error, addDocument, updateDocument, deleteDocument } = useFirestore('transfers');

  const addTransfer = async (transferData) => {
    return await addDocument({
      clientName: transferData.clientName,
      transfers: transferData.transfers || [],
      boletas: transferData.boletas || [],
      finalBalance: transferData.finalBalance,
      date: new Date().toISOString().split('T')[0]
    });
  };

  return {
    transfers: documents,
    loading,
    error,
    addTransfer,
    updateTransfer: updateDocument,
    deleteTransfer: deleteDocument
  };
};
