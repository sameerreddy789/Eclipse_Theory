import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase only if the API key is present
let app;

console.log("[Firebase] Initializing with Project ID:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);

if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    console.log("[Firebase] Initialization successful");
  } catch (error) {
    console.error("[Firebase] Initialization failed:", error);
  }
} else {
  console.warn("[Firebase] Missing NEXT_PUBLIC_FIREBASE_API_KEY. Initialization skipped.");
}

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

export default app;
