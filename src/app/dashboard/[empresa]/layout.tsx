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

  const empresaId = params.empresa as string;

  useEffect(() => {
    if (!cargando && !datosUsuario) {
      router.push("/login");
    }
  }, [datosUsuario, cargando, router]);

  if (cargando || !datosUsuario) {
    return (
      <div className="min-h-screen bg-[#1e1f22] flex items-center justify-center text-white">
        <p className="animate-pulse">Cargando entorno...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#1e1f22] text-white overflow-hidden">
      <Encabezado datosUsuario={datosUsuario} alCerrarSesion={logout} />

      <div className="flex flex-1 overflow-hidden">
        {/* Columna 1 — Canales */}
        <ColumnaCanales
          empresaId={empresaId}
          esAdministrador={datosUsuario.rol === "admin"}
          alCrearCanal={(nombre) => crearCanal(nombre, empresaId)}
          // 1. Eliminamos canalActivo={null} porque ya no es necesario
          // 2. Implementamos la navegación real:
          alSeleccionarCanal={(canal: Canal) => {
            router.push(`/dashboard/${empresaId}/${canal.id}`);
          } } canalId={params.canalId as string || ""}        />

        <main className="flex flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}