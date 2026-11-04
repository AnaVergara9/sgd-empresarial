"use client";

import { useParams } from "next/navigation";
import { useAuthContext } from "@/features/auth/AuthContext";
import ColumnaSubcanales from "@/features/canales/components/ColumnaSubcanales";

export default function CanalLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const { datosUsuario } = useAuthContext();

  if (!datosUsuario) return null;

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Columna 2 — Lista de subcanales */}
      <ColumnaSubcanales
        empresaId={params.empresa as string}
        canalId={params.canalId as string}
        subcanalId={(params.subcanalId as string) || ""}
        esAdministrador={datosUsuario.rol === "admin"}
      />

      {/* Espacio para Hilos y ChatArea */}
      <div className="flex flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
