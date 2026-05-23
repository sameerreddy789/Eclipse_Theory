import { initializeApp, getApps, deleteApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Masked debug log for production troubleshooting
if (typeof window !== "undefined") {
  console.log("[System] Firebase check:", {
    projectId: firebaseConfig.projectId || "MISSING",
    hasApiKey: !!firebaseConfig.apiKey,
    apiKeySnippet: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.slice(0, 5)}...` : "NONE"
  });
}

// Initialize Firebase only if the API key is a valid non-empty string
let app;
const isValidConfig = firebaseConfig.apiKey && firebaseConfig.apiKey !== "undefined" && firebaseConfig.apiKey.length > 10;

if (isValidConfig) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  } catch (error) {
    console.error("[Firebase] Initialization error:", error);
  }
}

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

export default app;
