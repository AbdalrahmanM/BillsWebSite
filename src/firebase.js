// إعداد وربط تطبيق Firebase
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDgNLMqhsfN-ACrLSZuE__w5AN-GlIIGRo",
  authDomain: "compoundapp-7a94.firebaseapp.com",
  projectId: "compoundapp-7a94",
  storageBucket: "compoundapp-7a94.firebasestorage.app",
  messagingSenderId: "335473906576",
  appId: "1:335473906576:android:5ed1e2424f422540d4d915"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
