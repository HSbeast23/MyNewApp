// ✅ Core Firebase imports
import { initializeApp } from 'firebase/app';
import {
  initializeAuth,
  getReactNativePersistence,
  getAuth
} from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';

// ✅ AsyncStorage for React Native auth persistence
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ Google Sign-In for signOut helper
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// ✅ Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCWN6jXv8A6UBUBznWM-1gOlHbvPjpToPk",
  authDomain: "bloodlink-fb49b.firebaseapp.com",
  projectId: "bloodlink-fb49b",
  storageBucket: "bloodlink-fb49b.appspot.com",
  messagingSenderId: "675390254350",
  appId: "1:675390254350:web:c9929da48f35986f81fb5f",
  measurementId: "G-KDMJ42X11S"
};

// ✅ Initialize Firebase app
const app = initializeApp(firebaseConfig);

// ✅ Initialize Auth with persistence for React Native
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// ✅ Fallback for web: uncomment if needed
// export const auth = getAuth(app);

// ✅ Initialize Analytics safely
isSupported().then((supported) => {
  if (supported) {
    getAnalytics(app);
  } else {
    console.log('Analytics not supported in this environment.');
  }
});

// ✅ Sign-out helper: signs out from Firebase & Google
export const signOutUser = async () => {
  try {
    await GoogleSignin.signOut(); // ✅ Sign out Google session
    await auth.signOut();         // ✅ Sign out Firebase session
    console.log('✅ User signed out from Google & Firebase.');
  } catch (error) {
    console.error('❌ Sign out error:', error);
  }
};
