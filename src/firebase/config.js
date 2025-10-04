// Firebase Configuration for React
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDXnnN0kwZxmcPZj08IRgoCm6cP89Lmk0E",
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

// Initialize anonymous authentication
export const initAuth = async () => {
  try {
    // Temporalmente deshabilitado para desarrollo
    console.log('✅ Firebase configurado (sin autenticación)');
    // await signInAnonymously(auth);
    // console.log('✅ Usuario autenticado anónimamente');
  } catch (error) {
    console.warn('⚠️ Error en autenticación (continuando sin auth):', error.message);
    // Continuar sin autenticación para desarrollo
  }
};

export default app;
