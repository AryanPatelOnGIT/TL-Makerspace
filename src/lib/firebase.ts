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

const isEmulatorMode = import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === 'true'

if (!rawApiKey && !isEmulatorMode) {
  throw new Error(
    'Firebase API key is not configured. Set VITE_FIREBASE_API_KEY or VITE_FIREBASE_API_KEY_B64, ' +
    'or enable emulator mode with VITE_USE_EMULATORS=true.'
  )
}

const firebaseConfig = {
  apiKey: rawApiKey || (isEmulatorMode ? 'fake-api-key-emulator' : ''),
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || (isEmulatorMode ? 'localhost' : ''),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || (isEmulatorMode ? 'demo-project' : ''),
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || (isEmulatorMode ? 'demo-project.appspot.com' : ''),
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || (isEmulatorMode ? '000000000000' : ''),
  appId: import.meta.env.VITE_FIREBASE_APP_ID || (isEmulatorMode ? '1:000000000000:web:000000000000' : ''),
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || (isEmulatorMode ? 'G-0000000000' : ''),
}

export const isFirebaseConfigured = Boolean(
  (import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY_B64) &&
  (!isEmulatorMode ? (import.meta.env.VITE_FIREBASE_PROJECT_ID && import.meta.env.VITE_FIREBASE_APP_ID) : true)
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
