"use client"; // Indica que este es un Componente de Cliente de React

// Importamos los hooks necesarios de React y de nuestra aplicación
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

// Importamos los componentes de la interfaz
import Dashboard from "@/components/layout/Dashboard";
import Login from "@/components/layout/Login";
import SetupProfile from "@/components/layout/SetupProfile";

/**
 * Componente principal de la página de inicio.
 * Se encarga de decidir qué vista mostrar al usuario según su estado de autenticación:
 * 1. Pantalla de carga (mientras se verifica la sesión)
 * 2. Pantalla de Login (si no ha iniciado sesión)
 * 3. Pantalla de Configuración de Perfil (si es la primera vez que entra)
 * 4. Dashboard (si ya está autenticado y tiene perfil)
 */
export default function Home() {
  // Extraemos los datos y funciones de nuestro hook personalizado de autenticación
  const { user, usuarioData, loading, login, logout, setupProfile } = useAuth();

  // Si todavía estamos cargando la información del usuario, mostramos un spinner (rueda de carga)
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-discord-darkest text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-discord-accent"></div>
      </div>
    );
  }

  // Si el usuario no ha iniciado sesión, mostramos el componente de Login
  if (!user) {
    return <Login onLogin={login} />;
  }

  // Si el usuario ya inició sesión pero no hemos encontrado sus datos en la base de datos (Firestore),
  // le pedimos que complete su perfil (por ejemplo, el nombre de su empresa)
  if (!usuarioData) {
    return <SetupProfile onComplete={setupProfile} />;
  }

  // Si todo está correcto (sesión iniciada y perfil completo), mostramos el Dashboard principal
  return <Dashboard user={user} usuarioData={usuarioData} onLogout={logout} />;
}