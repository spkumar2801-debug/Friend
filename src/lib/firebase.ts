import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const env = import.meta.env as Record<string, string | undefined>;

let runtimeApiKey: string | null = null;

/** Called once at startup with the key loaded from the server. */
export function setFirebaseApiKey(key: string) {
  runtimeApiKey = key;
}

export function hasFirebaseApiKey() {
  return Boolean(runtimeApiKey || env["VITE_FIREBASE_API_KEY"] || firebaseConfig.apiKey);
}

const firebaseConfig = {
  get apiKey() {
    return (
      runtimeApiKey ??
      env["VITE_FIREBASE_API_KEY"] ??
      "AIzaSyAgG2mqGfET8eKY_TLLE1z3Ml5sWhNXwc0"
    );
  },
  authDomain: env["VITE_FIREBASE_AUTH_DOMAIN"] ?? "friend-7b157.firebaseapp.com",
  projectId: env["VITE_FIREBASE_PROJECT_ID"] ?? "friend-7b157",
  storageBucket: env["VITE_FIREBASE_STORAGE_BUCKET"] ?? "friend-7b157.firebasestorage.app",
  messagingSenderId: env["VITE_FIREBASE_MESSAGING_SENDER_ID"] ?? "56217805650",
  appId: env["VITE_FIREBASE_APP_ID"] ?? "1:56217805650:web:2068b72ce7f7e7aae4108b",
  measurementId: env["VITE_FIREBASE_MEASUREMENT_ID"] ?? "G-92CHBRTL5L",
};

/** Firebase is browser-only in this app: never initialise during SSR. */
export function getFirebaseApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}

export function getDb(): Firestore {
  return getFirestore(getFirebaseApp());
}

export function googleProvider() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}
