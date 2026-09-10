/* ==========================================================================
   AQUASOURCE FIREBASE CONFIGURATION & DATABASE ADAPTER (firebase-config.js)
   ========================================================================== */

/**
 * AquaSource Firebase Project Configuration
 */
const firebaseConfig = {
  apiKey: "AIzaSyCAmwsW7BnyljRblb3Oe3N5BnjDhGxSt40",
  authDomain: "aquasource-bc968.firebaseapp.com",
  projectId: "aquasource-bc968",
  storageBucket: "aquasource-bc968.firebasestorage.app",
  messagingSenderId: "337344568561",
  appId: "1:337344568561:web:418b20c42492d432d01d50",
  measurementId: "G-5ESNKSBXL8"
};

// Global Firebase Handles
let fbApp = null;
let fbFirestore = null;
let isFirebaseOnline = false;

/**
 * Initialize Firebase connection for Buyer Tracking
 */
function initFirebaseApp() {
  try {
    if (typeof firebase !== 'undefined') {
      if (firebase.apps && firebase.apps.length > 0) {
        fbApp = firebase.app();
      } else {
        fbApp = firebase.initializeApp(firebaseConfig);
      }

      // Initialize Cloud Firestore
      if (firebase.firestore) {
        fbFirestore = firebase.firestore();
      }

      isFirebaseOnline = true;
    }
  } catch (err) {
    console.warn('Firebase initialization error:', err);
    isFirebaseOnline = false;
  }
}