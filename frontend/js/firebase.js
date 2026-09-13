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

// Initialize Firebase App & Auth
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
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

console.log("🔥 Firebase initialized successfully for project: moniterxx");
