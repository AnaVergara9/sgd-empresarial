// app/dashboard/page.tsx
"use client";

import { useAutenticacion } from "@/hooks/useAuth";
import { useState } from "react";
// ... importa tus columnas y el Encabezado aquí

export default function DashboardPage() {
  const { datosUsuario, cargando, logout } = useAutenticacion();
  
  // Aquí pones los estados que tenías en el otro archivo
  const [canalActivo, setCanalActivo] = useState(null);
  const [subcanalActivo, setSubcanalActivo] = useState(null);
  const [hiloActivo, setHiloActivo] = useState(null);

  // 1. Si está cargando la sesión de Firebase
  if (cargando) return <p>Cargando aplicación...</p>;

  // 2. Si no hay usuario (protección de ruta)
  if (!datosUsuario) return <p>No tienes acceso. Inicia sesión.</p>;

  const esAdministrador = datosUsuario.rol === "admin";

  return (
    <div className="flex flex-col h-screen bg-[#1e1f22]">
       <Encabezado datosUsuario={datosUsuario} alCerrarSesion={logout} />
       {/* El resto de tu layout de columnas aquí... */}
    </div>
  );
}