import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let auth;
let db;

const firebaseConfig = {
    apiKey: "AIzaSyBay2UCARUVoJ43ABf5exjsD-ttqeVkpU0",
    authDomain: "mywebsite-9d8e8.firebaseapp.com",
    projectId: "mywebsite-9d8e8",
    storageBucket: "mywebsite-9d8e8.appspot.com",
    messagingSenderId: "756167696887",
    appId: "1:756167696887:web:b1d714fc8a27ec1b32cef2"
};

try {
    const app = initializeApp(firebaseConfig);
    console.log('Firebase initialized successfully:', app.name);

    auth = getAuth(app);
    db = getFirestore(app);
    console.log('Firestore instance initialized:', db.app.name);

    // Optional: Emulator connection (uncomment if needed)
    /*
    if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
        import { connectAuthEmulator } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
        import { connectFirestoreEmulator } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
        connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
        connectFirestoreEmulator(db, "localhost", 8080);
        console.log('Connected to Firebase Emulators (Auth:9099, Firestore:8080)');
    }
    */
} catch (error) {
    console.error('Firebase initialization failed:', error);
    auth = null;
    db = null;
}

// ✅ EXPORT ALL THE HELPERS YOU NEED IN profile.js
export { auth, db, doc, getDoc, setDoc, collection, query, where, getDocs, addDoc };