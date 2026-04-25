// src/config/firebaseConfig.ts
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  initializeAuth, 
  // @ts-ignore - O TS não vê este membro no perfil Web, mas ele existe no RN
  getReactNativePersistence,
  Auth 
} from 'firebase/auth'; 
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFunctions } from 'firebase/functions'; // ADICIONA ISTO

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const functions = getFunctions(app); // ADICIONA ISTO
const db = getFirestore(app);

/**
 * Persistência oficial corrigida para silenciar o log e o TS
 */
const authInstance: Auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export const auth = authInstance; 
export { app, db, functions }; // GARANTE QUE EXPORTAS 'functions'
