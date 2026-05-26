"use client";

import { useAutenticacion } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function EmpresaLayout({ children }: { children: React.ReactNode }) {
  const { datosUsuario, cargando } = useAutenticacion();
  const router = useRouter();

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

  // Al retornar solo el <main> con {children}, este layout deja de 
  // pintar una segunda barra de canales y un segundo encabezado.
  return (
    <main className="flex flex-1 overflow-hidden h-full w-full">
      {children}
    </main>
  );
}