// lib/firebase.ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; 

const firebaseConfig = {
  apiKey: "AIzaSyBipAVlLY3Oz5-MzJsjSyRZPysb4Hk4rTE",
  authDomain: "nada-e90b7.firebaseapp.com",
  projectId: "nada-e90b7",
  storageBucket: "nada-e90b7.firebasestorage.app",
  messagingSenderId: "588610000723",
  appId: "1:588610000723:web:bfbd6e3d4f294c877633a6",
  measurementId: "G-6WVEGP3JR2"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app); 
const storage = getStorage(app);

export { auth, db, storage};
