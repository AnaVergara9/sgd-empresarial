"use client";

import { useParams, useRouter } from "next/navigation"; // Importamos useRouter
import { useAutenticacion } from "@/hooks/useAuth";
import ColumnaSubcanales from "@/components/navigation/ColumnaSubcanales";
import { crearSubcanal } from "@/services/firestoreService";
import { Subcanal } from "@/types";

export default function CanalLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const router = useRouter(); // Inicializamos el router
  const { datosUsuario } = useAutenticacion();

  const empresaId = params.empresa as string;
  const canalId = params.canalId as string;

  if (!datosUsuario) return null;

  const esAdministrador = datosUsuario.rol === "admin";

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Columna 2 — Lista de subcanales */}
      <ColumnaSubcanales
        empresaId={empresaId}
        canalId={canalId}
        esAdministrador={esAdministrador}
        alCrearSubcanal={(nombre) => crearSubcanal(nombre, empresaId, canalId)}
        // En lugar de un Error, ahora navegamos de verdad:
        alSeleccionarSubcanal={(subcanal: Subcanal) => {
          router.push(`/dashboard/${empresaId}/${canalId}/${subcanal.id}`);
        } } subcanalId={params.subcanalId as string || ""}        
      />

      {/* Espacio para Hilos y ChatArea */}
      <div className="flex flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}