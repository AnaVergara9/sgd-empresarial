"use client";

import { useRouter } from "next/navigation";
import { Subcanal } from "@/types";
import { useColeccion } from "@/shared/firestore";
import { crear, eliminarSubcanal, rutaSubcanales } from "../canales.api";
import ColumnaNavegacion from "./ColumnaNavegacion";

interface PropiedadesColumnaSubcanales {
  empresaId: string;
  canalId: string;
  subcanalId: string;
  esAdministrador: boolean;
}

export default function ColumnaSubcanales({ empresaId, canalId, subcanalId, esAdministrador }: PropiedadesColumnaSubcanales) {
  const router = useRouter();
  const ruta = empresaId && canalId ? rutaSubcanales(empresaId, canalId) : null;
  const { datos, cargando, error } = useColeccion<Subcanal>(ruta);

  return (
    <ColumnaNavegacion
      titulo="SUBCANALES"
      nombreElemento="subcanal"
      icono="≡"
      claseActiva="bg-[#5865f2] text-white"
      elementos={datos}
      cargando={cargando}
      error={error}
      idActivo={subcanalId}
      esAdministrador={esAdministrador}
      alSeleccionar={(subcanal) => router.push(`/dashboard/${empresaId}/${canalId}/${subcanal.id}`)}
      alCrear={(nombre) => crear(rutaSubcanales(empresaId, canalId), nombre)}
      alEliminar={async (subcanal) => {
        await eliminarSubcanal(empresaId, canalId, subcanal.id);
        // Si el subcanal eliminado era el activo, redirigimos al área general del canal
        if (subcanal.id === subcanalId) router.push(`/dashboard/${empresaId}/${canalId}`);
      }}
      mensajeConfirmacion={(subcanal) =>
        `¿Estás seguro de que deseas eliminar el subcanal "${subcanal.nombre}"? Se borrarán todos sus hilos y mensajes.`
      }
    />
  );
}
