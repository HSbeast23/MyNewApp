// firebase.js  ✅ or services/auth.js

// 1️⃣ Core Firebase imports
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence
} from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';

// 2️⃣ AsyncStorage for auth persistence
import AsyncStorage from '@react-native-async-storage/async-storage';

// 3️⃣ Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCWN6jXv8A6UBUBznWM-1gOlHbvPjpToPk",
  authDomain: "bloodlink-fb49b.firebaseapp.com",
  projectId: "bloodlink-fb49b",
  storageBucket: "bloodlink-fb49b.appspot.com", // ✅ corrected spelling!
  messagingSenderId: "675390254350",
  appId: "1:675390254350:web:c9929da48f35986f81fb5f",
  measurementId: "G-KDMJ42X11S"
};

// 4️⃣ Initialize Firebase app
const app = initializeApp(firebaseConfig);

// 5️⃣ Initialize Auth with persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// ✅ OR fallback if using web: export const auth = getAuth(app);

// 6️⃣ Initialize Analytics safely
isSupported().then((supported) => {
  if (supported) {
    getAnalytics(app);
  } else {
    console.log('Analytics not supported in this environment.');
  }
});
