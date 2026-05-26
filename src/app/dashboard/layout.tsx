"use client";

import { useAutenticacion } from "@/hooks/useAuth";
import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";
import Encabezado from "@/components/modules/Encabezado";
import ColumnaCanales from "@/components/navigation/ColumnaCanales";
import { crearCanal } from "@/services/firestoreService";
import { Canal } from "@/types";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { datosUsuario, logout, cargando } = useAutenticacion();
  const router = useRouter();
  const params = useParams();

  const canalIdActual = (params?.canalId as string) || "";

  useEffect(() => {
    if (!cargando && !datosUsuario) {
      router.push("/login");
    }
  }, [datosUsuario, cargando, router]);

  if (cargando || !datosUsuario) {
    return (
      <div className="min-h-screen bg-[#1e1f22] flex items-center justify-center text-white">
        <p className="animate-pulse">Cargando...</p>
      </div>
    );
  }

  const manejarSeleccionarCanal = (canal: Canal) => {
    router.push(`/dashboard/${datosUsuario.empresa}/${canal.id}`);
  };

  return (
    <div className="flex flex-col h-screen bg-[#1e1f22] text-white overflow-hidden">
      {/* El Encabezado se queda fijo arriba */}
      <Encabezado datosUsuario={datosUsuario} alCerrarSesion={logout} />

      <div className="flex flex-1 overflow-hidden">
        {/* La Columna de Canales se queda fija a la izquierda */}
        <ColumnaCanales
                  empresaId={datosUsuario.empresa}
                  esAdministrador={datosUsuario.rol === "admin"}
                  alCrearCanal={(nombre) => crearCanal(nombre, datosUsuario.empresa)} 
                  canalId={canalIdActual} 
                  alSeleccionarCanal={manejarSeleccionarCanal}    />

        {/* Aquí es donde Next.js meterá los Subcanales, Hilos y el Chat */}
        <main className="flex flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}