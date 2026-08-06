import { initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyD6COwvoBFUZSrIEz9p8CEj7ARy5kkAlGs",
  authDomain: "expense-tracker-75c88.firebaseapp.com",
  projectId: "expense-tracker-75c88",
  storageBucket: "expense-tracker-75c88.firebasestorage.app",
  messagingSenderId: "994135541777",
  appId: "1:994135541777:web:c3fd2b2d823bb2d418c9b0",
  measurementId: "G-898E3BEWQ0",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  doc,
  getDoc,
  setDoc,
};
