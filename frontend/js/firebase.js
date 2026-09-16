// Firebase Web SDK Integration for MyMonitorXX
// Using modular CDN scripts compatible with pure static browser and PWA
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// User's Firebase web app configuration
const firebaseConfig = {
  apiKey: "AIzaSyAbbNzhS4bTNf8QvfjtjOfCO5q2jdvhYbM",
  authDomain: "moniterxx.firebaseapp.com",
  projectId: "moniterxx",
  storageBucket: "moniterxx.firebasestorage.app",
  messagingSenderId: "439926466954",
  appId: "1:439926466954:web:3ae1e67b38d929b8abc073",
  measurementId: "G-7G26TRLH5X"
};

// Initialize Firebase App, Auth & Firestore
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const googleProvider = new GoogleAuthProvider();

// Expose Firebase Authentication Helper on window
window.FirebaseAuth = {
  auth,
  
  // Sign in with Email and Password
  async loginWithEmail(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const token = await cred.user.getIdToken();
    return { user: cred.user, token };
  },

  // Register user in Firebase Auth
  async registerWithEmail(email, password) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const token = await cred.user.getIdToken();
    return { user: cred.user, token };
  },

  // Sign in with Google Popup
  async loginWithGoogle() {
    const result = await signInWithPopup(auth, googleProvider);
    const token = await result.user.getIdToken();
    return { user: result.user, token };
  },

  // Sign out
  async logout() {
    await signOut(auth);
  },

  // Get current user ID token
  async getIdToken() {
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken(true);
    }
    return null;
  },

  // Listen to auth state
  onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback);
  }
};

// Expose Cloud Firestore Database Helper on window for Real-time Cloud Sync across all devices
window.FirebaseDb = {
  db,

  // Save complete state to Firebase Firestore Cloud
  async saveAppState(state) {
    try {
      if (!db) return false;
      // Deep clone to clean any prototype / non-JSON items
      const cleanState = JSON.parse(JSON.stringify(state));
      // Never store local UI activeTab in global cloud state
      delete cleanState.currentUser;
      delete cleanState.currentRole;
      delete cleanState.activeTab;

      // CRITICAL SECURITY HARDENING: Strip plaintext passwords before sending to Firestore
      if (Array.isArray(cleanState.users)) {
        cleanState.users = cleanState.users.map(u => {
          const sanitized = { ...u };
          delete sanitized.password;
          return sanitized;
        });
      }
      if (Array.isArray(cleanState.hodsList)) {
        cleanState.hodsList = cleanState.hodsList.map(h => {
          const sanitized = { ...h };
          delete sanitized.password;
          return sanitized;
        });
      }
      if (Array.isArray(cleanState.teachersList)) {
        cleanState.teachersList = cleanState.teachersList.map(t => {
          const sanitized = { ...t };
          delete sanitized.password;
          return sanitized;
        });
      }

      await setDoc(doc(db, "campus_system", "state"), cleanState, { merge: true });
      console.log("☁️ State synced to Firebase Cloud Firestore securely (all passwords stripped)!");
      return true;
    } catch (err) {
      console.warn("⚠️ Firestore cloud sync notice:", err.message);
      return false;
    }
  },

  // Load state from Firestore Cloud
  async loadAppState() {
    try {
      if (!db) return null;
      const snap = await getDoc(doc(db, "campus_system", "state"));
      if (snap.exists()) {
        console.log("☁️ Loaded latest state from Firebase Cloud Firestore!");
        return snap.data();
      }
      return null;
    } catch (err) {
      console.warn("⚠️ Firestore cloud load notice:", err.message);
      return null;
    }
  },

  // Subscribe to real-time updates from Firebase Cloud Firestore
  subscribeToAppState(callback) {
    try {
      if (!db) return () => {};
      return onSnapshot(doc(db, "campus_system", "state"), (snap) => {
        if (snap.exists()) {
          console.log("⚡ Real-time cloud update received from Firebase!");
          callback(snap.data());
        }
      }, (err) => {
        console.warn("⚠️ Firestore listener notice:", err.message);
      });
    } catch (err) {
      console.warn("⚠️ Firestore subscription notice:", err.message);
      return () => {};
    }
  }
};

console.log("🔥 Firebase Auth & Firestore initialized successfully for project: moniterxx");

