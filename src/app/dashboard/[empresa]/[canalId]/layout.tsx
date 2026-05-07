"use client";

import { useParams } from "next/navigation";
import { useAutenticacion } from "@/hooks/useAuth";
import ColumnaSubcanales from "@/components/navigation/ColumnaSubcanales";
import { crearSubcanal } from "@/services/firestoreService";
import { Subcanal } from "@/types";

export default function CanalLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const { datosUsuario } = useAutenticacion();

  // Obtenemos los IDs de la URL
  const empresaId = params.empresa as string;
  const canalId = params.canalId as string;

  if (!datosUsuario) return null;

  const esAdministrador = datosUsuario.rol === "admin";

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* 1. Columna 2 — Lista de Subcanales */}
      {/* Esta columna aparece solo porque ya estamos dentro de la ruta [canalId] */}
      <ColumnaSubcanales
        esAdministrador={esAdministrador}
        alCrearSubcanal={(nombre) => crearSubcanal(nombre, empresaId, canalId)} canalActivo={undefined} subcanalActivo={null} alSeleccionarSubcanal={function (subcanal: Subcanal): void {
          throw new Error("Function not implemented.");
        } }      />

      {/* 2. Espacio para las siguientes capas (Hilos y ChatArea) */}
      <div className="flex flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}