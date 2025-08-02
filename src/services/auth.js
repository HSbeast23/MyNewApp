// src/services/auth.js

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCWN6jXv8A6UBUBznWM-1gOlHbvPjpToPk",
  authDomain: "bloodlink-fb49b.firebaseapp.com",
  projectId: "bloodlink-fb49b",
  storageBucket: "bloodlink-fb49b.appspot.com",
  messagingSenderId: "675390254350",
  appId: "1:675390254350:web:c9929da48f35986f81fb5f",
  measurementId: "G-KDMJ42X11S",
};

// ✅ Safe App Initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// ✅ Safe Auth Initialization
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error) {
  if (error.code === 'auth/already-initialized') {
    auth = getAuth(app);
  } else {
    console.error('❌ Auth init error:', error);
    throw error;
  }
}

// ✅ Firestore
const db = getFirestore(app);

// ✅ Optional: Analytics
isSupported().then((supported) => {
  if (supported) {
    getAnalytics(app);
    console.log('✅ Analytics initialized.');
  } else {
    console.log('⚠️ Analytics not supported.');
  }
});


// ✅ Google Sign-Out helper (Expo AuthSession: just sign out from Firebase)
export const signOutUser = async () => {
  try {
    await auth.signOut();
    console.log('✅ User signed out from Firebase.');
  } catch (error) {
    console.error('❌ Sign out error:', error);
  }
};

// ✅ Export both!
export { auth, db };
