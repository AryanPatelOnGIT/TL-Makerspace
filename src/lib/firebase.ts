import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import {
  getFirestore,
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'

const rawApiKey = import.meta.env.VITE_FIREBASE_API_KEY ||
  (import.meta.env.VITE_FIREBASE_API_KEY_B64
    ? atob(import.meta.env.VITE_FIREBASE_API_KEY_B64)
    : undefined)

const firebaseConfig = {
  apiKey: rawApiKey || 'AIzaSyDemoKeyForDevelopmentModeOnly123',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'tinkers-lab-dev.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'tinkers-lab-dev',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'tinkers-lab-dev.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1234567890:web:1234567890',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-1234567890',
}

export const isFirebaseConfigured = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY_B64
)

// Initialize Firebase app
export const app = initializeApp(firebaseConfig)

// Auth
export const auth = getAuth(app)

// Firestore with persistent local cache for offline support & reduced reads
// (helps stay within free tier limits)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
})

// Connect to emulators in development if needed
if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099')
  connectFirestoreEmulator(db, 'localhost', 8080)
}
