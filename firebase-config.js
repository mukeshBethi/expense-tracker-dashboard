// ============================================================
//  Firebase setup — one-time steps in the Firebase Console
//  (https://console.firebase.google.com), project: expense-tracker-75c88
//
//  1. Authentication → Sign-in method → enable "Email/Password".
//  2. Firestore Database → Create database (production mode).
//  3. Firestore → Rules → paste:
//
//    rules_version = '2';
//    service cloud.firestore {
//      match /databases/{database}/documents {
//        match /users/{userId} {
//          allow read, write: if request.auth != null
//                             && request.auth.uid == userId;
//        }
//      }
//    }
//
//  4. Run the app from a local server if testing locally (required by some
//     browsers for ES module imports): npx serve .
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyD6COwvoBFUZSrIEz9p8CEj7ARy5kkAlGs",
  authDomain: "expense-tracker-75c88.firebaseapp.com",
  projectId: "expense-tracker-75c88",
  storageBucket: "expense-tracker-75c88.firebasestorage.app",
  messagingSenderId: "994135541777",
  appId: "1:994135541777:web:c3fd2b2d823bb2d418c9b0",
  measurementId: "G-898E3BEWQ0"
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
