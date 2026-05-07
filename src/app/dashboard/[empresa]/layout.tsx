"use client";

import { useAutenticacion } from "@/hooks/useAuth";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import Encabezado from "@/components/modules/Encabezado";
import ColumnaCanales from "@/components/navigation/ColumnaCanales";
import { crearCanal } from "@/services/firestoreService";
import { Canal } from "@/types";

export default function EmpresaLayout({ children }: { children: React.ReactNode }) {
  const { datosUsuario, logout, cargando } = useAutenticacion();
  const params = useParams();
  const router = useRouter();

  // El "empresa" en la URL debe coincidir con la empresa del usuario
  const empresaId = params.empresa as string;

  useEffect(() => {
    // Si terminó de cargar y no hay usuario, mandarlo al login
    if (!cargando && !datosUsuario) {
      router.push("/login");
    }
  }, [datosUsuario, cargando, router]);

  if (cargando || !datosUsuario) {
    return (
      <div className="min-h-screen bg-[#1e1f22] flex items-center justify-center text-white">
        <p className="animate-pulse">Cargando entorno de empresa...</p>
      </div>
    );
  }

  const esAdministrador = datosUsuario.rol === "admin";

  return (
    <div className="flex flex-col h-screen bg-[#1e1f22] text-white overflow-hidden">
      {/* 1. Encabezado superior */}
      <Encabezado datosUsuario={datosUsuario} alCerrarSesion={logout} />

      <div className="flex flex-1 overflow-hidden">
        {/* 2. Columna 1 — Lista de Canales (Siempre visible en esta ruta) */}
        <ColumnaCanales
          empresaId={empresaId}
          esAdministrador={esAdministrador}
          alCrearCanal={(nombre) => crearCanal(nombre, empresaId)} canalActivo={null} alSeleccionarCanal={function (canal: Canal): void {
            throw new Error("Function not implemented.");
          } }          // Nota: El 'canalActivo' ahora lo manejaremos por la URL, 
          // no por un estado local de React.
        />

        {/* 3. Espacio para las siguientes columnas (Subcanales, Hilos, Chat) */}
        <main className="flex flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}