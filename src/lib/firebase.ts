/**
 * Firebase Configuration and Initialization
 * 
 * This file configures Firebase services for the Chaching financial management platform:
 * - Firestore for document-based data storage
 * - Firebase Auth for user authentication and session management
 * 
 * Architecture: User-scoped data isolation with security rules
 * Dependencies: firebase@11.8.1, @firebase/firestore, @firebase/auth
 */

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

// Firebase configuration object
// Note: These are public keys and safe to expose in client-side code
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase app (avoid multiple initialization)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firestore database
export const db = getFirestore(app);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Development environment setup - Using production Firebase services
// Emulator connection disabled to use live Firebase project
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  console.log('Using production Firebase services for development');
  // Note: Emulators disabled - using live Firebase project: chaching-yjluf
}

// Export the Firebase app instance
export default app;

/**
 * Environment Variables Required:
 * 
 * NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
 * NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
 * NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
 * NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
 * NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
 * NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
 * 
 * Security Features:
 * - Client-side configuration (safe for public exposure)
 * - Firestore security rules enforce user data isolation
 * - Authentication required for all database operations
 * - Development emulator support for local testing
 */