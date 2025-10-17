// Firebase Hooks for React
import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
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
import { getLocalDateString } from '../utils/date';

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
      console.log('🔥 ===== FIREBASE addDocument =====');
      console.log('📅 Fecha específica que se guarda:', data.date);
      console.log('📅 Tipo de fecha:', typeof data.date);
      console.log('📅 Fecha actual del sistema:', new Date().toLocaleDateString('es-AR'));
      
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
      console.log('🔍 updateDocument - Intentando actualizar:', {
        collectionName,
        docId,
        data: Object.keys(data)
      });
      
      // Verificar que el documento existe
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        console.error('❌ updateDocument - El documento no existe:', docId);
        throw new Error(`Documento ${docId} no existe en la colección ${collectionName}`);
      }
      
      console.log('✅ updateDocument - Documento existe, actualizando...');
      
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ updateDocument - Documento actualizado exitosamente');
    } catch (error) {
      console.error('❌ updateDocument - Error:', error);
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

  // Función específica para eliminar repartos
  const deleteReparto = async (repartoId) => {
    try {
      await deleteDoc(doc(db, 'repartos', repartoId));
    } catch (error) {
      console.error('Error al eliminar reparto:', error);
      throw error;
    }
  };

  const addReparto = async (repartoCompleto) => {
    try {
      // Validaciones
      if (!repartoCompleto.clientes || repartoCompleto.clientes.length === 0) {
        throw new Error('El reparto debe tener al menos un cliente');
      }
      
      if (!repartoCompleto.date) {
        throw new Error('La fecha del reparto es requerida');
      }

      // Guardar TODO el reparto como un solo documento
      const repartoId = await addDocument({
        date: repartoCompleto.date,
        clientes: repartoCompleto.clientes,
        total: repartoCompleto.total || 0,
        cantidad: repartoCompleto.cantidad || repartoCompleto.clientes.length,
        createdAt: new Date().toISOString()
      });

      // Log único para verificar la fecha
      console.log('📅 REPARTO GUARDADO - Fecha del programa:', repartoCompleto.date, '| Fecha guardada en Firebase:', repartoCompleto.date);
      
      return repartoId;
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
    reparto.date === getLocalDateString()
  );

  return {
    repartos: documents,
    todayRepartos,
    loading,
    error,
    addReparto,
    updatePayment,
    deleteReparto,
    getRepartosByDate,
    updateDocument
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
      date: getLocalDateString()
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
      fecha: data.fecha || getLocalDateString()
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
      userId: 'shared', // Todos los usuarios comparten los datos
      timestamp: new Date().toISOString()
    });
  };

  const getFeedbacksByUser = async (userId = 'shared') => {
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
      userId: 'shared', // Todos los usuarios comparten el perfil
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

  const getProfileByUser = async (userId = 'shared') => {
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

// Hook específico para preferencias del usuario del asistente
export const useAsistentePreferences = () => {
  const { documents, loading, error } = useFirestoreRealtime('asistente_preferences');
  const { addDocument, updateDocument, getDocumentsByField } = useFirestore('asistente_preferences');

  const savePreferences = async (preferences) => {
    try {
      const existing = await getDocumentsByField('userId', 'shared');
      
      if (existing.length > 0) {
        // Actualizar documento existente
        await updateDocument(existing[0].id, {
          ...preferences,
          lastUpdated: new Date().toISOString()
        });
        console.log('✅ Preferencias actualizadas');
      } else {
        // Crear nuevo documento
        await addDocument({
          userId: 'shared', // Todos los usuarios comparten las preferencias
          ...preferences,
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        });
        console.log('✅ Preferencias creadas');
      }
    } catch (error) {
      console.error('Error guardando preferencias:', error);
    }
  };

  const getPreferences = () => {
    const userPrefs = documents.find(doc => doc.userId === 'shared');
    return userPrefs || null;
  };

  return {
    preferences: getPreferences(),
    loading,
    error,
    savePreferences
  };
};

// Hook específico para mensajes guardados del asistente
export const useAsistenteMessages = () => {
  const { documents, loading, error } = useFirestoreRealtime('asistente_mensajes');
  const { addDocument, updateDocument, deleteDocument, getDocumentsByField } = useFirestore('asistente_mensajes');

  const addMessage = async (data) => {
    console.log('💾 Guardando mensaje en Firebase:', data);
    const result = await addDocument({
      userId: 'shared', // Todos los usuarios comparten los mensajes
      userInput: data.userInput,
      generatedMessage: data.generatedMessage,
      destinatario: data.destinatario,
      tono: data.tono,
      contexto: data.contexto,
      tipoMensaje: data.tipoMensaje || 'whatsapp',
      userProfile: data.userProfile || null,
      timestamp: new Date().toISOString(),
      isEdited: false,
      editedMessage: null
    });
    console.log('✅ Mensaje guardado con ID:', result);
    return result;
  };

  const updateMessage = async (messageId, data) => {
    console.log('📝 Actualizando mensaje:', messageId, data);
    return await updateDocument(messageId, {
      ...data,
      lastEdited: new Date().toISOString()
    });
  };

  const getMessagesByUser = async (userId = 'shared') => {
    return await getDocumentsByField('userId', userId);
  };

  // Mostrar todos los mensajes y ordenar por timestamp descendente
  const userMessages = documents
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  console.log('📨 Mensajes cargados:', userMessages.length, userMessages);

  return {
    messages: userMessages,
    loading,
    error,
    addMessage,
    updateMessage,
    deleteMessage: deleteDocument,
    getMessagesByUser
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
  const getCurrentMonthUsage = async (userId = 'shared') => {
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
          userId: 'shared', // Todos los usuarios comparten el contador
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
  const incrementMessageCount = async (userId = 'shared') => {
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
  const canGenerateMessage = async (userId = 'shared') => {
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

// ==================== GESTIÓN SEMANAL ====================

// Hook para gestionar la semana activa
export const useGestionSemanal = (userId) => {
  const [semanaActiva, setSemanaActiva] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Obtener o crear semana activa
  useEffect(() => {
    // Obtener todas las semanas activas sin filtrar por usuario (sin orderBy para evitar índices)
    const collectionRef = collection(db, 'gestion_semanal');

    const unsubscribe = onSnapshot(collectionRef, (snapshot) => {
      // Filtrar localmente por semanas activas (cerrada: false)
      const semanasActivas = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.cerrada === false) {
          semanasActivas.push({ id: doc.id, ...data });
        }
      });
      
      // Ordenar por fecha de inicio (más reciente primero)
      semanasActivas.sort((a, b) => {
        const fechaA = new Date(a.fechaInicio);
        const fechaB = new Date(b.fechaInicio);
        return fechaB - fechaA;
      });
      
      // Tomar la semana más reciente
      setSemanaActiva(semanasActivas.length > 0 ? semanasActivas[0] : null);
      setLoading(false);
    }, (err) => {
      console.error('Error al obtener semana activa:', err);
      setError(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  // Crear nueva semana
  const crearNuevaSemana = async () => {
    try {
      const nuevaSemana = {
        userId: 'shared', // Usuario compartido para que todos vean los datos
        fechaInicio: new Date().toISOString(),
        cerrada: false,
        mercaderia: [],
        embutidos: [],
        empleados: [],
        adelantos: [],
        gastos: [],
        clientesCuenta: []
      };

      const docRef = await addDoc(collection(db, 'gestion_semanal'), nuevaSemana);
      return docRef.id;
    } catch (err) {
      console.error('Error al crear semana:', err);
      throw err;
    }
  };

  // Cerrar semana actual
  const cerrarSemana = async () => {
    if (!semanaActiva) return;

    try {
      await updateDoc(doc(db, 'gestion_semanal', semanaActiva.id), {
        cerrada: true,
        fechaCierre: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error al cerrar semana:', err);
      throw err;
    }
  };

  // Agregar entrada de mercadería
  const agregarMercaderia = async (entrada) => {
    if (!semanaActiva) {
      const id = await crearNuevaSemana();
      await updateDoc(doc(db, 'gestion_semanal', id), {
        mercaderia: [{ ...entrada, timestamp: new Date().toISOString() }]
      });
      return;
    }

    try {
      const mercaderiaActual = semanaActiva.mercaderia || [];
      await updateDoc(doc(db, 'gestion_semanal', semanaActiva.id), {
        mercaderia: [...mercaderiaActual, { ...entrada, timestamp: new Date().toISOString() }]
      });
    } catch (err) {
      console.error('Error al agregar mercadería:', err);
      throw err;
    }
  };

  // Eliminar entrada de mercadería
  const eliminarMercaderia = async (index) => {
    if (!semanaActiva) return;

    try {
      const mercaderiaActual = semanaActiva.mercaderia || [];
      const nuevaMercaderia = mercaderiaActual.filter((_, i) => i !== index);
      await updateDoc(doc(db, 'gestion_semanal', semanaActiva.id), {
        mercaderia: nuevaMercaderia
      });
    } catch (err) {
      console.error('Error al eliminar mercadería:', err);
      throw err;
    }
  };

  // Actualizar entrada de mercadería
  const actualizarMercaderia = async (index, entradaActualizada) => {
    if (!semanaActiva) return;

    try {
      const mercaderiaActual = semanaActiva.mercaderia || [];
      const nuevaMercaderia = [...mercaderiaActual];
      nuevaMercaderia[index] = { ...entradaActualizada, timestamp: mercaderiaActual[index]?.timestamp || new Date().toISOString() };
      await updateDoc(doc(db, 'gestion_semanal', semanaActiva.id), {
        mercaderia: nuevaMercaderia
      });
    } catch (err) {
      console.error('Error al actualizar mercadería:', err);
      throw err;
    }
  };

  // Agregar entrada de embutidos
  const agregarEmbutidos = async (entrada) => {
    if (!semanaActiva) {
      const id = await crearNuevaSemana();
      await updateDoc(doc(db, 'gestion_semanal', id), {
        embutidos: [{ ...entrada, timestamp: new Date().toISOString() }]
      });
      return;
    }

    try {
      const embutidosActual = semanaActiva.embutidos || [];
      await updateDoc(doc(db, 'gestion_semanal', semanaActiva.id), {
        embutidos: [...embutidosActual, { ...entrada, timestamp: new Date().toISOString() }]
      });
    } catch (err) {
      console.error('Error al agregar embutidos:', err);
      throw err;
    }
  };

  // Eliminar entrada de embutidos
  const eliminarEmbutidos = async (index) => {
    if (!semanaActiva) return;

    try {
      const embutidosActual = semanaActiva.embutidos || [];
      const nuevosEmbutidos = embutidosActual.filter((_, i) => i !== index);
      await updateDoc(doc(db, 'gestion_semanal', semanaActiva.id), {
        embutidos: nuevosEmbutidos
      });
    } catch (err) {
      console.error('Error al eliminar embutidos:', err);
      throw err;
    }
  };

  // Actualizar entrada de embutidos
  const actualizarEmbutidos = async (index, entradaActualizada) => {
    if (!semanaActiva) return;

    try {
      const embutidosActual = semanaActiva.embutidos || [];
      const nuevosEmbutidos = [...embutidosActual];
      nuevosEmbutidos[index] = { ...entradaActualizada, timestamp: embutidosActual[index]?.timestamp || new Date().toISOString() };
      await updateDoc(doc(db, 'gestion_semanal', semanaActiva.id), {
        embutidos: nuevosEmbutidos
      });
    } catch (err) {
      console.error('Error al actualizar embutidos:', err);
      throw err;
    }
  };

  // Agregar/actualizar empleado
  const gestionarEmpleado = async (empleado) => {
    if (!semanaActiva) {
      const id = await crearNuevaSemana();
      await updateDoc(doc(db, 'gestion_semanal', id), {
        empleados: [empleado]
      });
      return;
    }

    try {
      const empleadosActual = semanaActiva.empleados || [];
      const index = empleadosActual.findIndex(e => e.nombre === empleado.nombre);
      
      let nuevosEmpleados;
      if (index !== -1) {
        nuevosEmpleados = [...empleadosActual];
        nuevosEmpleados[index] = empleado;
      } else {
        nuevosEmpleados = [...empleadosActual, empleado];
      }

      await updateDoc(doc(db, 'gestion_semanal', semanaActiva.id), {
        empleados: nuevosEmpleados
      });
    } catch (err) {
      console.error('Error al gestionar empleado:', err);
      throw err;
    }
  };

  // Agregar adelanto a empleado
  const agregarAdelanto = async (adelanto) => {
    if (!semanaActiva) {
      const id = await crearNuevaSemana();
      await updateDoc(doc(db, 'gestion_semanal', id), {
        adelantos: [{ ...adelanto, timestamp: new Date().toISOString() }]
      });
      return;
    }

    try {
      const adelantosActual = semanaActiva.adelantos || [];
      await updateDoc(doc(db, 'gestion_semanal', semanaActiva.id), {
        adelantos: [...adelantosActual, { ...adelanto, timestamp: new Date().toISOString() }]
      });
    } catch (err) {
      console.error('Error al agregar adelanto:', err);
      throw err;
    }
  };

  // Eliminar adelanto
  const eliminarAdelanto = async (index) => {
    if (!semanaActiva) return;

    try {
      const adelantosActual = semanaActiva.adelantos || [];
      const nuevosAdelantos = adelantosActual.filter((_, i) => i !== index);
      await updateDoc(doc(db, 'gestion_semanal', semanaActiva.id), {
        adelantos: nuevosAdelantos
      });
    } catch (err) {
      console.error('Error al eliminar adelanto:', err);
      throw err;
    }
  };

  // Agregar gasto
  const agregarGasto = async (gasto) => {
    if (!semanaActiva) {
      const id = await crearNuevaSemana();
      await updateDoc(doc(db, 'gestion_semanal', id), {
        gastos: [{ ...gasto, timestamp: new Date().toISOString() }]
      });
      return;
    }

    try {
      const gastosActual = semanaActiva.gastos || [];
      await updateDoc(doc(db, 'gestion_semanal', semanaActiva.id), {
        gastos: [...gastosActual, { ...gasto, timestamp: new Date().toISOString() }]
      });
    } catch (err) {
      console.error('Error al agregar gasto:', err);
      throw err;
    }
  };

  // Eliminar gasto
  const eliminarGasto = async (index) => {
    if (!semanaActiva) return;

    try {
      const gastosActual = semanaActiva.gastos || [];
      const nuevosGastos = gastosActual.filter((_, i) => i !== index);
      await updateDoc(doc(db, 'gestion_semanal', semanaActiva.id), {
        gastos: nuevosGastos
      });
    } catch (err) {
      console.error('Error al eliminar gasto:', err);
      throw err;
    }
  };

  // Agregar boleta a cliente
  const agregarBoletaCliente = async (nombreCliente, boleta) => {
    if (!semanaActiva) {
      const id = await crearNuevaSemana();
      await updateDoc(doc(db, 'gestion_semanal', id), {
        clientesCuenta: [{
          nombre: nombreCliente,
          boletas: [{ ...boleta, timestamp: new Date().toISOString() }]
        }]
      });
      return;
    }

    try {
      const clientesActual = semanaActiva.clientesCuenta || [];
      const clienteIndex = clientesActual.findIndex(c => c.nombre === nombreCliente);

      let nuevosClientes;
      if (clienteIndex !== -1) {
        nuevosClientes = [...clientesActual];
        const boletasActuales = nuevosClientes[clienteIndex].boletas || [];
        nuevosClientes[clienteIndex].boletas = [...boletasActuales, { ...boleta, timestamp: new Date().toISOString() }];
      } else {
        nuevosClientes = [...clientesActual, {
          nombre: nombreCliente,
          boletas: [{ ...boleta, timestamp: new Date().toISOString() }]
        }];
      }

      await updateDoc(doc(db, 'gestion_semanal', semanaActiva.id), {
        clientesCuenta: nuevosClientes
      });
    } catch (err) {
      console.error('Error al agregar boleta a cliente:', err);
      throw err;
    }
  };

  // Eliminar boleta de cliente
  const eliminarBoletaCliente = async (nombreCliente, boletaIndex) => {
    if (!semanaActiva) return;

    try {
      const clientesActual = semanaActiva.clientesCuenta || [];
      const clienteIndex = clientesActual.findIndex(c => c.nombre === nombreCliente);

      if (clienteIndex === -1) return;

      const nuevosClientes = [...clientesActual];
      nuevosClientes[clienteIndex].boletas = nuevosClientes[clienteIndex].boletas.filter((_, i) => i !== boletaIndex);

      // Si no quedan boletas, eliminar el cliente
      if (nuevosClientes[clienteIndex].boletas.length === 0) {
        nuevosClientes.splice(clienteIndex, 1);
      }

      await updateDoc(doc(db, 'gestion_semanal', semanaActiva.id), {
        clientesCuenta: nuevosClientes
      });
    } catch (err) {
      console.error('Error al eliminar boleta de cliente:', err);
      throw err;
    }
  };

  // Actualizar cliente completo (nombre y boletas)
  const actualizarCliente = async (clienteIndex, clienteActualizado) => {
    if (!semanaActiva) return;

    try {
      const clientesActual = semanaActiva.clientesCuenta || [];
      const nuevosClientes = [...clientesActual];
      nuevosClientes[clienteIndex] = clienteActualizado;
      await updateDoc(doc(db, 'gestion_semanal', semanaActiva.id), {
        clientesCuenta: nuevosClientes
      });
    } catch (err) {
      console.error('Error al actualizar cliente:', err);
      throw err;
    }
  };

  // Obtener historial de semanas cerradas
  const getHistorialSemanas = async () => {
    try {
      // Obtener todas las semanas y filtrar localmente
      const collectionRef = collection(db, 'gestion_semanal');
      const querySnapshot = await getDocs(collectionRef);
      
      const semanasCerradas = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.cerrada === true) {
          semanasCerradas.push({ id: doc.id, ...data });
        }
      });
      
      // Ordenar por fecha de cierre (más reciente primero)
      semanasCerradas.sort((a, b) => {
        const fechaA = new Date(a.fechaCierre);
        const fechaB = new Date(b.fechaCierre);
        return fechaB - fechaA;
      });
      
      return semanasCerradas;
    } catch (err) {
      console.error('Error al obtener historial de semanas:', err);
      throw err;
    }
  };

  // Obtener datos de una semana específica por ID
  const getSemanaById = async (semanaId) => {
    try {
      const docRef = doc(db, 'gestion_semanal', semanaId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        throw new Error('Semana no encontrada');
      }
    } catch (err) {
      console.error('Error al obtener semana por ID:', err);
      throw err;
    }
  };

  // Funciones para configuraciones de usuario
  const getConfiguracionesUsuario = async () => {
    try {
      const q = query(
        collection(db, 'user_configs'),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error obteniendo configuraciones:', error);
      return null;
    }
  };

  const guardarConfiguracionesUsuario = async (configuraciones) => {
    try {
      const configuracionesExistentes = await getConfiguracionesUsuario();
      
      if (configuracionesExistentes) {
        // Actualizar documento existente
        await updateDoc(doc(db, 'user_configs', configuracionesExistentes.id), {
          ...configuraciones,
          lastUpdated: new Date().toISOString()
        });
        console.log('✅ Configuraciones actualizadas');
      } else {
        // Crear nuevo documento
        await addDoc(collection(db, 'user_configs'), {
          userId,
          ...configuraciones,
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        });
        console.log('✅ Configuraciones creadas');
      }
    } catch (error) {
      console.error('Error guardando configuraciones:', error);
      throw error;
    }
  };

  return {
    semanaActiva,
    loading,
    error,
    crearNuevaSemana,
    cerrarSemana,
    agregarMercaderia,
    eliminarMercaderia,
    actualizarMercaderia,
    agregarEmbutidos,
    eliminarEmbutidos,
    actualizarEmbutidos,
    gestionarEmpleado,
    agregarAdelanto,
    eliminarAdelanto,
    agregarGasto,
    eliminarGasto,
    agregarBoletaCliente,
    eliminarBoletaCliente,
    actualizarCliente,
    getHistorialSemanas,
    getSemanaById,
    getConfiguracionesUsuario,
    guardarConfiguracionesUsuario
  };
};