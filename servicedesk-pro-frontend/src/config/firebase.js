import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Konfiguracja Firebase (dla lokalnych emulatorów)
const firebaseConfig = {
  apiKey: 'demo-api-key',
  authDomain: 'demo-project.firebaseapp.com',
  projectId: 'demo-servicedesk-pro',
  storageBucket: 'demo-project.appspot.com',
  messagingSenderId: '123456789',
  appId: 'demo-app-id',
};

// Inicjalizacja Firebase
const app = initializeApp(firebaseConfig);

// Inicjalizacja serwisów
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Połączenie z emulatorami (tylko lokalnie)
if (window.location.hostname === 'localhost') {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
  console.log('🔥 Connected to Firebase Emulators');
}

export default app;
