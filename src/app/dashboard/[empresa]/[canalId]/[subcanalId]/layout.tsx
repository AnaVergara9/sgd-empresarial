"use client";

import { useParams } from "next/navigation";
import { useAutenticacion } from "@/hooks/useAuth";
import ColumnaHilos from "@/components/navigation/Hilos"; // Asegúrate que la ruta sea correcta
import { crearHilo } from "@/services/firestoreService";

export default function SubcanalLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const { datosUsuario } = useAutenticacion();

  // Sacamos todos los IDs necesarios de la URL
  const empresaId = params.empresa as string;
  const canalId = params.canalId as string;
  const subcanalId = params.subcanalId as string;

  if (!datosUsuario) return null;

  const esAdministrador = datosUsuario.rol === "admin";

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* 1. Columna 3 — Lista de Hilos */}
      <ColumnaHilos
        canalId={canalId}
        subcanalId={subcanalId}
        // hiloActivo lo manejará la URL automáticamente en el siguiente nivel
        alSeleccionarHilo={(hilo) => {
          // Navegamos a la ruta del hilo
          window.location.href = `/dashboard/${empresaId}/${canalId}/${subcanalId}/${hilo.id}`;
        } }
        esAdministrador={esAdministrador}
        alCrearHilo={(nombre) => crearHilo(nombre, empresaId, canalId, subcanalId)} hiloActivo={null}      />

      {/* 2. Espacio para el ChatArea final */}
      <div className="flex flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}