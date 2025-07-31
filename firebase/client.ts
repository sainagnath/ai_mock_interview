// Import the functions you need from the SDKs you need
import { initializeApp,getApp,getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDBVAuq03nKf_aWDdO36GSYXXt4IjFad2M",
  authDomain: "prepwise-5b303.firebaseapp.com",
  projectId: "prepwise-5b303",
  storageBucket: "prepwise-5b303.firebasestorage.app",
  messagingSenderId: "885675908819",
  appId: "1:885675908819:web:13b5a1ad06233439917e26",
  measurementId: "G-0TPCH5667V"
};

// Initialize Firebase
const app = !getApps.length ? initializeApp(firebaseConfig) : getApp(); 
export const auth = getAuth(app);
export const db = getFirestore(app);
