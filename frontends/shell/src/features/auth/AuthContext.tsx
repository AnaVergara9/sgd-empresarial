"use client";

import { createContext, useContext } from "react";
import { useAutenticacion } from "./useAutenticacion";

// Tipo del contexto: es exactamente lo que devuelve el hook useAutenticacion
type AuthContextValor = ReturnType<typeof useAutenticacion>;

const AuthContext = createContext<AuthContextValor | null>(null);

/**
 * Proveedor de autenticación.
 * Ejecuta useAutenticacion() una sola vez (un solo onAuthStateChanged y un solo getDoc del usuario)
 * y comparte el resultado con todos los layouts y páginas que estén dentro de él.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const valor = useAutenticacion();
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

/**
 * Hook para leer la sesión desde el contexto en lugar de volver a suscribirse a Firebase.
 */
export function useAuthContext() {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error("useAuthContext debe usarse dentro de un AuthProvider");
  }
  return contexto;
}
