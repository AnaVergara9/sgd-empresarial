"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User, signInWithPopup, signOut } from "firebase/auth"; // Importamos funciones de Firebase Auth
import { auth, db, googleProvider } from "@/lib/firebase"; // Importamos configuración de Firebase
import { doc, getDoc, setDoc } from "firebase/firestore";// Importamos funciones de Firebase (Firestore)
import { Usuario } from "@/types"; // Importamos tipo Usuario
import { registrarNuevoUsuario } from "@/services/authService"; // Importamos el servicio

/**
 * Custom Hook: useAuth
 * Este "gancho" personalizado centraliza toda la lógica de autenticación de la aplicación.
 * Permite que cualquier componente sepa quién está conectado y qué datos tiene.
 */
export function useAutenticacion() {
  const [usuarioAuth, setUsuarioAuth] = useState<User | null>(null); //Guarda datos de autenticación (trae nombre, cedula, email..)
  const [datosUsuario, setDatosUsuario] = useState<Usuario | null>(null); //Guarda datos adicionales del usuario (empresa, color de avatar..)
  const [cargando, setCargando] = useState(true); //Indicador si todavía estamos cargando el inicio de sesión

  // Este efecto se ejecuta una sola vez al cargar la página
  useEffect(() => {
    // Escuchamos los cambios en el estado de autenticación (cuando alguien entra o sale)
    const cancelarSuscripcion = onAuthStateChanged(auth, async (usuario) => {
      setUsuarioAuth(usuario); // Guardamos la info básica del usuario (si hay)
      
      if (usuario) {
        // Si el usuario está conectado, vamos a Firestore a buscar sus datos adicionales
        const docUsuario = await getDoc(doc(db, "usuarios", usuario.uid));
        if (docUsuario.exists()) {
          // Si sus datos ya existen en la base de datos, los cargamos
          setDatosUsuario(docUsuario.data() as Usuario);
        } else {
          // Si no existen datos guardados, avisamos que necesita configurar su perfil
          setDatosUsuario(null); 
        }
      } else {
        // Si el usuario no está conectado, borramos sus datos locales
        setDatosUsuario(null);
      }
      // Terminamos el proceso de carga
      setCargando(false);
    });

    // Esta función "limpia" el escucha cuando el componente deja de existir
    return () => cancelarSuscripcion();
  }, []);

  /**
   * Función para iniciar sesión con Google mediante una ventana emergente.
   */
  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error al iniciar sesión con Google", error);
    }
  };

  /**
   * Función para cerrar la sesión del usuario actual.
   */
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error al cerrar sesión", error);
    }
  };

  /**
   * Ahora esta función recibe la CEDULA y usa el servicio de validación
   */
  const configurarPerfil = async (cedula: string, empresa: string, cargo: string) => {
    if (!usuarioAuth) return;


    const rolActual = "admin"; 
    // Lógica de colores por rol
    const color = rolActual === "admin" ? "#5865F2" : "#43b581";

    const nuevoUsuario: Usuario = {
      uid: usuarioAuth.uid,
      cedula: cedula,
      nombre: usuarioAuth.displayName || "Usuario",
      cargo: cargo,
      rol: rolActual,
      email: usuarioAuth.email || "",
      empresa: empresa, // El slug para la URL
      avatarColor: color,
      creadoEn: new Date(),
    };

    try {
      // Se llama al servicio (Controlador) para validar cédula y guardar
      await registrarNuevoUsuario(nuevoUsuario);
      setDatosUsuario(nuevoUsuario);
    } catch (error: any) {
      // Manejo de error si la cédula ya existe
      alert(error.message);
      throw error;
    }
  };

  return { usuarioAuth, datosUsuario, cargando, login, logout, configurarPerfil };
}