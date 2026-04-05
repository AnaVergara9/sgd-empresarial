// Importamos las funciones necesarias del SDK de Firebase (versión 9+)
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/**
 * Configuración de Firebase.
 * Las variables de entorno (las que empiezan por NEXT_PUBLIC_) deben estar configuradas
 * tanto en tu archivo .env.local como en el panel de control de Vercel.
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Inicializamos la aplicación de Firebase. 
// Si ya hay una app inicializada, la usamos; si no, creamos una nueva.
// Esto evita errores de "duplicate app" en Next.js durante el desarrollo (Hot Reload).
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Obtenemos los servicios que vamos a usar:
const auth = getAuth(app); // Servicio de Autenticación
const db = getFirestore(app); // Servicio de Base de Datos (Cloud Firestore)
const googleProvider = new GoogleAuthProvider(); // Configuración para entrar con Google

// Exportamos estos servicios para usarlos en cualquier lugar de la app
export { app, auth, db, googleProvider };