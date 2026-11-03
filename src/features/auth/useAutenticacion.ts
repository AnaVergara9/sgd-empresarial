"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import { Rol, Usuario } from "@/types";
import {
  cerrarSesion,
  escucharSesion,
  iniciarSesionConGoogle,
  obtenerOCrearUsuario,
  registrarNuevoUsuario,
} from "./auth.api";

/**
 * Custom Hook: useAutenticacion
 * Guarda el estado de la sesión (quién está conectado y sus datos).
 * El acceso a Firebase vive en auth.api.ts.
 *
 * Dentro del dashboard no se usa directamente: se usa useAuthContext() para no
 * repetir la suscripción en cada layout.
 */
export function useAutenticacion() {
  const [usuarioAuth, setUsuarioAuth] = useState<User | null>(null); // Datos de Firebase Auth (nombre, email..)
  const [datosUsuario, setDatosUsuario] = useState<Usuario | null>(null); // Datos de Firestore (empresa, rol, color..)
  const [cargando, setCargando] = useState(true); // Si todavía estamos cargando el inicio de sesión

  useEffect(() => {
    const cancelarSuscripcion = escucharSesion(async (usuario) => {
      // Mientras traemos sus datos de Firestore, volvemos a "cargando" para que
      // ninguna página vea un usuario conectado pero todavía sin datos
      if (usuario) setCargando(true);
      let datos: Usuario | null = null;
      try {
        datos = usuario ? await obtenerOCrearUsuario(usuario) : null;
      } catch (error) {
        // Si Firestore falla no nos quedamos cargando para siempre
        console.error("Error al cargar los datos del usuario", error);
      } finally {
        // Ambos se actualizan juntos, cuando ya tenemos toda la información
        setUsuarioAuth(usuario);
        setDatosUsuario(datos);
        setCargando(false);
      }
    });

    return () => cancelarSuscripcion();
  }, []);

  const login = useCallback(async () => {
    try {
      await iniciarSesionConGoogle();
    } catch (error) {
      console.error("Error al iniciar sesión con Google", error);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await cerrarSesion();
    } catch (error) {
      console.error("Error al cerrar sesión", error);
    }
  }, []);

  /**
   * Completa el perfil validando la cédula. Si falla, lanza el error para que la página lo muestre.
   */
  const configurarPerfil = useCallback(
    async (cedula: string, empresa: string, nombreEmpresa: string, cargo: string, rol: Rol = "empleado") => {
      if (!usuarioAuth) return;
      const nuevoUsuario = await registrarNuevoUsuario(usuarioAuth, { cedula, empresa, nombreEmpresa, cargo, rol });
      setDatosUsuario(nuevoUsuario);
    },
    [usuarioAuth]
  );

  // Memorizamos el objeto para que los consumidores del contexto no se re-rendericen sin necesidad
  return useMemo(
    () => ({ usuarioAuth, datosUsuario, cargando, login, logout, configurarPerfil }),
    [usuarioAuth, datosUsuario, cargando, login, logout, configurarPerfil]
  );
}
