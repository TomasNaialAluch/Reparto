// Firebase Hooks for React
import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  setDoc,
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

  console.log(`🔄 useFirestore inicializado para colección: ${collectionName}`);

  // Función para generar ID basado en fecha
  const generateDateBasedId = async (date) => {
    // Formatear fecha como DDMMYYYY
    const dateStr = date.replace(/-/g, '');
    const day = dateStr.slice(6, 8);
    const month = dateStr.slice(4, 6);
    const year = dateStr.slice(0, 4);
    const baseId = `${day}${month}${year}`;
    
    // Buscar documentos que empiecen con esta fecha
    const q = query(
      collection(db, collectionName),
      where('__name__', '>=', baseId),
      where('__name__', '<', baseId + 'z'), // 'z' es el último carácter ASCII
      orderBy('__name__', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const existingIds = querySnapshot.docs.map(doc => doc.id);
    
    // Encontrar el siguiente número secuencial
    let counter = 1;
    let newId = baseId;
    
    while (existingIds.includes(newId)) {
      newId = baseId + counter;
      counter++;
    }
    
    return newId;
  };

  // Función para agregar documento (usa ID automático por defecto)
  const addDocument = async (data, customId = null) => {
    try {
      console.log(`📝 Intentando agregar documento a colección: ${collectionName}`, data);
      
      if (customId) {
        const customRef = doc(db, collectionName, customId);
        await setDoc(customRef, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        console.log(`✅ Documento agregado con ID personalizado: ${customId}`);
        return customId;
      }

      const ref = await addDoc(collection(db, collectionName), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      console.log(`✅ Documento agregado exitosamente con ID: ${ref.id}`);
      return ref.id;
    } catch (error) {
      console.error(`❌ Error al agregar documento a ${collectionName}:`, error);
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

  // Función para obtener documentos con filtro (simplificada)
  const getDocumentsByField = async (field, value) => {
    try {
      // Consulta simple sin orderBy para evitar índices
      const collectionRef = collection(db, collectionName);
      const querySnapshot = await getDocs(collectionRef);
      
      const docs = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data[field] === value) {
          docs.push({
            id: doc.id,
            ...data
          });
        }
      });
      
      // Ordenar localmente por createdAt si existe
      docs.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return b.createdAt.toDate() - a.createdAt.toDate();
        }
        return 0;
      });
      
      return docs;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Compatibilidad: buscar por fecha (orden local)
  const getDocumentsByDateId = async (date) => {
    try {
      const collectionRef = collection(db, collectionName);
      const querySnapshot = await getDocs(collectionRef);
      const docs = [];
      querySnapshot.forEach((d) => {
        const data = d.data();
        if (data.date === date) {
          docs.push({ id: d.id, ...data });
        }
      });
      docs.sort((a, b) => (a.createdAt && b.createdAt) ? (b.createdAt.toDate() - a.createdAt.toDate()) : 0);
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
    getDocumentsByField,
    getDocumentsByDateId,
    generateDateBasedId
  };
};

// Hook para escuchar cambios en tiempo real (sin orderBy para evitar índices)
export const useFirestoreRealtime = (collectionName) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log(`🔄 Iniciando listener para colección: ${collectionName}`);
    
    try {
      // Consulta simple sin orderBy para evitar necesidad de índices
      const collectionRef = collection(db, collectionName);
      
      const unsubscribe = onSnapshot(collectionRef, 
        (querySnapshot) => {
          console.log(`📦 Snapshot recibido para ${collectionName}:`, querySnapshot.docs.length, 'documentos');
          const docs = [];
          querySnapshot.forEach((doc) => {
            docs.push({
              id: doc.id,
              ...doc.data()
            });
          });
          
          // Ordenar localmente por createdAt si existe
          docs.sort((a, b) => {
            if (a.createdAt && b.createdAt) {
              return b.createdAt.toDate() - a.createdAt.toDate();
            }
            return 0;
          });
          
          setDocuments(docs);
          setLoading(false);
          setError(null);
        },
        (error) => {
          console.error(`❌ Error en listener de ${collectionName}:`, error);
          setError(error.message);
          setLoading(false);
        }
      );

      return () => {
        console.log(`🛑 Desconectando listener de ${collectionName}`);
        unsubscribe();
      };
    } catch (error) {
      console.error(`❌ Error al configurar listener de ${collectionName}:`, error);
      setError(error.message);
      setLoading(false);
    }
  }, [collectionName]);

  return { documents, loading, error };
};

// Hook específico para repartos
export const useRepartos = () => {
  const { documents, loading, error } = useFirestoreRealtime('repartos');
  const { addDocument, updateDocument, deleteDocument, getDocumentsByField, getDocumentsByDateId } = useFirestore('repartos');

  const addReparto = async (clientData) => {
    try {
      // Si es un reparto con múltiples clientes (card)
      if (clientData.clients && Array.isArray(clientData.clients)) {
        return await addDocument({
          date: clientData.date || new Date().toISOString().split('T')[0],
          clients: clientData.clients,
          isCardReparto: clientData.isCardReparto || false,
          createdAt: clientData.createdAt || new Date().toISOString()
        });
      }
      
      // Si es un cliente individual (formato original)
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
        date: clientData.date || new Date().toISOString().split('T')[0],
        isCardReparto: clientData.isCardReparto || false
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
      // Usar búsqueda por ID basado en fecha (más eficiente)
      return await getDocumentsByDateId(date);
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
  const { documents, loading, error } = useFirestoreRealtime('clientBalances');
  const { addDocument, updateDocument, deleteDocument } = useFirestore('clientBalances');

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
export const useTransferenciasClientes = () => {
  const { documents, loading, error } = useFirestoreRealtime('TransferenciasClientes');
  const { addDocument, updateDocument, deleteDocument } = useFirestore('TransferenciasClientes');

  const addTransferencia = async (data) => {
    return await addDocument({
      nombreCliente: data.nombreCliente,
      transferencias: data.transferencias || [],
      boletas: data.boletas || [],
      totalTransferencias: data.totalTransferencias || 0,
      totalBoletas: data.totalBoletas || 0,
      saldoFinal: data.saldoFinal || 0,
      fecha: data.fecha || new Date().toISOString().split('T')[0]
    });
  };

  return {
    transferencias: documents,
    loading,
    error,
    addTransferencia,
    updateTransferencia: updateDocument,
    deleteTransferencia: deleteDocument
  };
};

// Hook específico para feedback del asistente
export const useAsistenteFeedback = () => {
  const { documents, loading, error } = useFirestoreRealtime('asistente_feedback');
  const { addDocument, updateDocument, deleteDocument, getDocumentsByField } = useFirestore('asistente_feedback');

  const addFeedback = async (data) => {
    return await addDocument({
      originalMessage: data.originalMessage,
      editedMessage: data.editedMessage,
      feedback: data.feedback,
      destinatario: data.destinatario,
      tono: data.tono,
      contexto: data.contexto,
      userId: data.userId || 'default_user', // Para futuras implementaciones multi-usuario
      timestamp: new Date().toISOString()
    });
  };

  const getFeedbacksByUser = async (userId = 'default_user') => {
    return await getDocumentsByField('userId', userId);
  };

  return {
    feedbacks: documents,
    loading,
    error,
    addFeedback,
    updateFeedback: updateDocument,
    deleteFeedback: deleteDocument,
    getFeedbacksByUser
  };
};

// Hook específico para perfil personalizado del asistente
export const useAsistenteProfile = () => {
  const { documents, loading, error } = useFirestoreRealtime('asistente_profile');
  const { addDocument, updateDocument, deleteDocument, getDocumentsByField } = useFirestore('asistente_profile');

  const addProfile = async (data) => {
    return await addDocument({
      userId: data.userId || 'default_user',
      profile: data.profile, // El perfil consolidado de Gemini
      feedbackCount: data.feedbackCount || 0,
      lastConsolidation: new Date().toISOString(),
      version: data.version || 1
    });
  };

  const updateProfile = async (profileId, data) => {
    return await updateDocument(profileId, {
      ...data,
      lastConsolidation: new Date().toISOString()
    });
  };

  const getProfileByUser = async (userId = 'default_user') => {
    const profiles = await getDocumentsByField('userId', userId);
    // Retornar el perfil más reciente
    return profiles.length > 0 ? profiles[0] : null;
  };

  return {
    profiles: documents,
    loading,
    error,
    addProfile,
    updateProfile,
    deleteProfile: deleteDocument,
    getProfileByUser
  };
};

// Hook específico para contador de mensajes mensual
export const useAsistenteUsage = () => {
  const { documents, loading, error } = useFirestoreRealtime('asistente_usage');
  const { addDocument, updateDocument, deleteDocument, getDocumentsByField } = useFirestore('asistente_usage');

  // Generar ID del mes actual (YYYY-MM)
  const getCurrentMonthId = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  // Obtener contador del mes actual
  const getCurrentMonthUsage = async (userId = 'default_user') => {
    try {
      const monthId = getCurrentMonthId();
      const usage = await getDocumentsByField('monthId', monthId);
      const userUsage = usage.find(u => u.userId === userId);
      
      if (userUsage) {
        // Actualizar límite si es el viejo (50) al nuevo (1500)
        if (userUsage.maxMessages === 50) {
          console.log('🔄 Actualizando límite de 50 a 1,500 mensajes');
          await updateDocument(userUsage.id, {
            maxMessages: 1500
          });
          userUsage.maxMessages = 1500;
        }
        return userUsage;
      } else {
        // Crear nuevo contador para el mes
        return await addDocument({
          userId,
          monthId,
          messageCount: 0,
          maxMessages: 1500, // Límite real de Gemini API gratuita
          createdAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error obteniendo uso del mes:', error);
      throw error;
    }
  };

  // Incrementar contador de mensajes
  const incrementMessageCount = async (userId = 'default_user') => {
    try {
      const currentUsage = await getCurrentMonthUsage(userId);
      
      if (currentUsage.messageCount >= currentUsage.maxMessages) {
        throw new Error('Límite mensual alcanzado');
      }
      
      return await updateDocument(currentUsage.id, {
        messageCount: currentUsage.messageCount + 1,
        lastMessageAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error incrementando contador:', error);
      throw error;
    }
  };

  // Verificar si puede generar más mensajes
  const canGenerateMessage = async (userId = 'default_user') => {
    try {
      const currentUsage = await getCurrentMonthUsage(userId);
      return currentUsage.messageCount < currentUsage.maxMessages;
    } catch (error) {
      console.error('Error verificando límite:', error);
      return false;
    }
  };

  // Obtener días hasta el reset
  const getDaysUntilReset = () => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const diffTime = nextMonth - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return {
    usage: documents,
    loading,
    error,
    getCurrentMonthUsage,
    incrementMessageCount,
    canGenerateMessage,
    getDaysUntilReset
  };
};