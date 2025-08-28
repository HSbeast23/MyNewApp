// src/services/auth.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ Correct Firebase config (from Project Settings → Web App)
const firebaseConfig = {
  apiKey: "AIzaSyCWN6jXv8A6UBUBznWM-1gOlHbvPjpToPk",
  authDomain: "bloodlink-fb49b.firebaseapp.com",
  projectId: "bloodlink-fb49b",
  storageBucket: "bloodlink-fb49b.appspot.com", // ✅ fixed
  messagingSenderId: "675390254350",
  appId: "1:675390254350:web:c9929da48f35986f81fb5f"
};

// Prevent multiple initializations
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Firebase services with AsyncStorage persistence
let auth;
try {
  // Always use AsyncStorage persistence for React Native
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (error) {
  // Fallback in case initializeAuth fails (already initialized)
  console.log('Auth already initialized, getting existing instance');
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);
