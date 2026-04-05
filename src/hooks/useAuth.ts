"use client";

import { useEffect, useState } from "react";
// Importamos funciones de Firebase Auth (Autenticación)
import { onAuthStateChanged, User, signInWithPopup, signOut } from "firebase/auth";
// Importamos nuestra configuración de Firebase
import { auth, db, googleProvider } from "@/lib/firebase";
// Importamos funciones de Firebase Firestore (Base de datos)
import { doc, getDoc, setDoc } from "firebase/firestore";
// Importamos nuestro tipo Usuario (definición de la forma de los datos)
import { Usuario } from "@/types";

/**
 * Custom Hook: useAuth
 * Este "gancho" personalizado centraliza toda la lógica de autenticación de la aplicación.
 * Permite que cualquier componente sepa quién está conectado y qué datos tiene.
 */
export function useAuth() {
  // Guardamos el usuario de autenticación de Firebase (trae nombre, email, foto...)
  const [user, setUser] = useState<User | null>(null);
  // Guardamos los datos adicionales del usuario que nosotros definimos (empresa, color de avatar...)
  const [usuarioData, setUsuarioData] = useState<Usuario | null>(null);
  // Un indicador para saber si todavía estamos procesando el inicio de sesión
  const [loading, setLoading] = useState(true);

  // Este efecto se ejecuta una sola vez al cargar la página
  useEffect(() => {
    // Escuchamos los cambios en el estado de autenticación (cuando alguien entra o sale)
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user); // Guardamos la info básica del usuario (si hay)
      
      if (user) {
        // Si el usuario está conectado, vamos a Firestore a buscar sus datos adicionales
        const userDoc = await getDoc(doc(db, "usuarios", user.uid));
        if (userDoc.exists()) {
          // Si sus datos ya existen en la base de datos, los cargamos
          setUsuarioData(userDoc.data() as Usuario);
        } else {
          // Si no existen datos guardados, avisamos que necesita configurar su perfil
          setUsuarioData(null); 
        }
      } else {
        // Si el usuario no está conectado, borramos sus datos locales
        setUsuarioData(null);
      }
      // Terminamos el proceso de carga
      setLoading(false);
    });

    // Esta función "limpia" el escucha cuando el componente deja de existir
    return () => unsubscribe();
  }, []);

  /**
   * Función para iniciar sesión con Google mediante una ventana emergente.
   */
  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error signing in with Google", error);
    }
  };

  /**
   * Función para cerrar la sesión del usuario actual.
   */
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  /**
   * Función para configurar el perfil de un usuario nuevo por primera vez.
   * Guarda los datos en Firestore (base de datos en la nube).
   */
  const setupProfile = async (empresa: string) => {
    if (!user) return;
    
    // Colores aleatorios para darle un toque visual diferente a cada usuario
    const colors = ["#5865f2", "#3ba55c", "#ed4245", "#faa61a", "#9b59b6"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    const newUsuario: Usuario = {
      uid: user.uid,
      nombre: user.displayName || "Usuario",
      email: user.email || "",
      empresa: empresa,
      avatarColor: randomColor,
      creadoEn: new Date(),
    };

    // Guardamos la información en la colección "usuarios" con el ID del usuario de Google
    await setDoc(doc(db, "usuarios", user.uid), newUsuario);
    // Actualizamos el estado local para que la interfaz sepa que ya hay perfil
    setUsuarioData(newUsuario);
  };

  // Exponemos (retornamos) todos los datos y funciones para que sean usados en el resto de la app
  return { user, usuarioData, loading, login, logout, setupProfile };
}