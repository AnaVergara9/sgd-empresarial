"use client";

import { AuthProvider, useAuthContext } from "@/features/auth/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";
import Encabezado from "@/features/auth/components/Encabezado";
import ColumnaCanales from "@/features/canales/components/ColumnaCanales";

// El layout principal carga la sesión una sola vez y la comparte con todo el dashboard
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DashboardContenido>{children}</DashboardContenido>
    </AuthProvider>
  );
}

function DashboardContenido({ children }: { children: React.ReactNode }) {
  const { datosUsuario, logout, cargando } = useAuthContext();
  const router = useRouter();
  const params = useParams();

  const canalIdActual = (params?.canalId as string) || "";
  // Un usuario sin empresa todavía no completó su registro y no puede entrar al dashboard
  const registroCompleto = !!datosUsuario?.empresa;

  useEffect(() => {
    if (!cargando && !registroCompleto) {
      router.push("/login");
    }
  }, [registroCompleto, cargando, router]);

  if (cargando || !datosUsuario || !registroCompleto) {
    return (
      <div className="min-h-screen bg-[#1e1f22] flex items-center justify-center text-white">
        <p className="animate-pulse">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#1e1f22] text-white overflow-hidden">
      {/* El Encabezado se queda fijo arriba */}
      <Encabezado datosUsuario={datosUsuario} alCerrarSesion={logout} />

      <div className="flex flex-1 overflow-hidden">
        {/* La Columna de Canales se queda fija a la izquierda */}
        <ColumnaCanales
          empresaId={datosUsuario.empresa}
          esAdministrador={datosUsuario.rol === "admin"}
          canalId={canalIdActual}
        />

        {/* Aquí es donde Next.js meterá los Subcanales, Hilos y el Chat */}
        <main className="flex flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
