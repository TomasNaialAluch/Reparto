import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, initializeFirebase } from '../firebase/config';

const FirebaseContext = createContext();

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase debe ser usado dentro de FirebaseProvider');
  }
  return context;
};

export const FirebaseProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribe;

    const initFirebaseApp = async () => {
      try {
        if (process.env.NODE_ENV !== 'production') console.log('🚀 Inicializando Firebase Provider...');
        setError(null);
        
        // Inicializar Firebase
        const success = await initializeFirebase();
        
        if (success) {
          if (process.env.NODE_ENV !== 'production') console.log('✅ Firebase inicializado correctamente en Provider');
          setFirebaseInitialized(true);
          
          // Configurar listener de autenticación
          unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
              if (process.env.NODE_ENV !== 'production') console.log('✅ Usuario autenticado en Provider:', user.displayName || user.email);
              setUser(user);
            } else {
              if (process.env.NODE_ENV !== 'production') console.log('❌ Usuario no autenticado en Provider');
              setUser(null);
            }
            setLoading(false);
          });
        } else {
          if (process.env.NODE_ENV !== 'production') console.error('❌ Error al inicializar Firebase en Provider');
          setError('Error al inicializar Firebase');
          setLoading(false);
        }
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') console.error('❌ Error en Firebase Provider:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    initFirebaseApp();

    // Cleanup
    return () => {
      if (unsubscribe) {
        if (process.env.NODE_ENV !== 'production') console.log('🛑 Desconectando listener de autenticación');
        unsubscribe();
      }
    };
  }, []);

  const value = {
    user,
    loading,
    firebaseInitialized,
    error,
    auth
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
};
