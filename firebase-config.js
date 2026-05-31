// ============================================
// FIREBASE CONFIGURATION
// JPTS UNIVERSITY - GRADE EVALUATION SYSTEM
// ============================================

// REPLACE THESE WITH YOUR FIREBASE PROJECT KEYS
const firebaseConfig = {
    apiKey: "AIzaSyC-5JaqF4RSs9wjmpml_2FoIi-qJj2v1Ek",
    authDomain: "computerized-grade-syste-68717.firebaseapp.com",
    projectId: "computerized-grade-syste-68717",
    storageBucket: "computerized-grade-syste-68717.firebasestorage.app",
    messagingSenderId: "802037769552",
    appId: "1:802037769552:web:64af8460da2790967d7855"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Enable offline persistence
db.enablePersistence().catch((err) => {
    console.log("Persistence error:", err);
});

// Make globally available
window.auth = auth;
window.db = db;
window.storage = storage;