"use client";

import { useParams } from "next/navigation";
import { useAuthContext } from "@/features/auth/AuthContext";
import ColumnaHilos from "@/features/canales/components/ColumnaHilos";

export default function SubcanalLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const { datosUsuario } = useAuthContext();

  if (!datosUsuario) return null;

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* 1. Columna 3 — Lista de Hilos */}
      <ColumnaHilos
        empresaId={params.empresa as string}
        canalId={params.canalId as string}
        subcanalId={params.subcanalId as string}
        hiloId={params.hiloId as string | undefined}
        esAdministrador={datosUsuario.rol === "admin"}
      />

      {/* 2. Espacio para el ChatArea final */}
      <div className="flex flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
