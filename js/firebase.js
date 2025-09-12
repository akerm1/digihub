import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let auth;
let db;

const firebaseConfig = {
    apiKey: "AIzaSyBay2UCARUVoJ43ABf5exjsD-ttqeVkpU0",
    authDomain: "mywebsite-9d8e8.firebaseapp.com",
    projectId: "mywebsite-9d8e8",
    storageBucket: "mywebsite-9d8e8.appspot.com", // ✅ FIXED
    messagingSenderId: "756167696887",
    appId: "1:756167696887:web:b1d714fc8a27ec1b32cef2"
};

try {
    const app = initializeApp(firebaseConfig);
    console.log('Firebase initialized successfully:', app.name);

    auth = getAuth(app);
    db = getFirestore(app);
    console.log('Firestore instance initialized:', db.app.name);

    // ❌ Comment this if not running emulators
    /*
    if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
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

export { auth, db };
