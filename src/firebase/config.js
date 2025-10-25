// Firebase Configuration for React
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDXnnN0kwZxmcPZjO8IRgoCm6cP89Lmk0E",
  authDomain: "mireparto-14d64.firebaseapp.com",
  projectId: "mireparto-14d64",
  storageBucket: "mireparto-14d64.firebasestorage.app",
  messagingSenderId: "1013979230857",
  appId: "1:1013979230857:web:265c727117a25c9ee10c58",
  measurementId: "G-V5DMOLCZEL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);

// Configurar el idioma para mensajes de error en español
auth.languageCode = 'es';

// Forzar configuración de dominio autorizado para desarrollo
if (window.location.hostname === 'localhost') {
  auth.settings.appVerificationDisabledForTesting = true;
}

// Initialize anonymous authentication
export const initAuth = async () => {
  try {
    // Temporalmente deshabilitado para debug
    // await signInAnonymously(auth);
  } catch (error) {
    console.warn('⚠️ Error en autenticación (continuando sin auth):', error.message);
    // Continuar sin autenticación para desarrollo
  }
};

// Función para inicializar Firebase en la aplicación
export const initializeFirebase = async () => {
  try {
    await initAuth();
    return true;
  } catch (error) {
    console.error('❌ Error al inicializar Firebase:', error);
    return false;
  }
};

export default app;
