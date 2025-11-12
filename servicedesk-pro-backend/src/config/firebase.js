const admin = require('firebase-admin');

// Dla lokalnych emulatorów nie potrzebujemy prawdziwych credentials
if (process.env.NODE_ENV === 'development') {
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
  process.env.FIREBASE_STORAGE_EMULATOR_HOST = 'localhost:9199';
}

// Inicjalizacja Firebase Admin
admin.initializeApp({
  projectId: 'demo-servicedesk-pro',
});

const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

console.log('🔥 Firebase Admin SDK initialized');

module.exports = { admin, db, auth, storage };
