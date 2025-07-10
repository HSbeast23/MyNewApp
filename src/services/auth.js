// services/auth.js  ✅ or config/firebase.js — same idea

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";  // ✅ Add this!
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCWN6jXv8A6UBUBznWM-1gOlHbvPjpToPk",
  authDomain: "bloodlink-fb49b.firebaseapp.com",
  projectId: "bloodlink-fb49b",
  storageBucket: "bloodlink-fb49b.appspot.com", // ✅ Note: add missing 't'
  messagingSenderId: "675390254350",
  appId: "1:675390254350:web:c9929da48f35986f81fb5f",
  measurementId: "G-KDMJ42X11S"
};

// ✅ Initialize Firebase app
const app = initializeApp(firebaseConfig);

// ✅ Set up Auth instance
export const auth = getAuth(app);

// ✅ You can still initialize Analytics if you want
const analytics = getAnalytics(app);
