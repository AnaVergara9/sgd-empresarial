"use client";

import { useRouter } from "next/navigation";
import { Hilo } from "@/types";
import { useColeccion } from "@/shared/firestore";
import { crear, eliminarHilo, rutaHilos } from "../canales.api";
import ColumnaNavegacion from "./ColumnaNavegacion";

interface PropiedadesColumnaHilos {
  empresaId: string;
  canalId: string;
  subcanalId: string;
  hiloId?: string;
  esAdministrador: boolean;
}

export default function ColumnaHilos({ empresaId, canalId, subcanalId, hiloId, esAdministrador }: PropiedadesColumnaHilos) {
  const router = useRouter();
  const ruta = empresaId && canalId && subcanalId ? rutaHilos(empresaId, canalId, subcanalId) : null;
  const { datos, cargando, error } = useColeccion<Hilo>(ruta);
  const rutaSubcanal = `/dashboard/${empresaId}/${canalId}/${subcanalId}`;

  return (
    <ColumnaNavegacion
      titulo="HILOS"
      nombreElemento="hilo"
      icono="💬"
      claseActiva="bg-[#5865f2] text-white"
      elementos={datos}
      cargando={cargando}
      error={error}
      idActivo={hiloId}
      esAdministrador={esAdministrador}
      alSeleccionar={(hilo) => router.push(`${rutaSubcanal}/${hilo.id}`)}
      alCrear={(nombre) => crear(rutaHilos(empresaId, canalId, subcanalId), nombre)}
      alEliminar={async (hilo) => {
        await eliminarHilo(empresaId, canalId, subcanalId, hilo.id);
        // Si el hilo eliminado es el que está abierto, volvemos al subcanal
        if (hilo.id === hiloId) router.push(rutaSubcanal);
      }}
      mensajeConfirmacion={(hilo) => `¿Estás seguro de que deseas eliminar el hilo "${hilo.nombre}"?`}
    />
  );
}
