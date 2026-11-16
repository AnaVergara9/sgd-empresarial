import type { Hilo } from "@/types";
import { useListaApi } from "../useListaApi";
import { crear, eliminarHilo, rutaHilos } from "../canales.api";
import ColumnaNavegacion from "./ColumnaNavegacion";

interface PropiedadesColumnaHilos {
  empresaId: string;
  canalId: string;
  subcanalId: string;
  hiloId?: string;
  esAdministrador: boolean;
  alNavegar: (ruta: string) => void;
}

export default function ColumnaHilos({ empresaId, canalId, subcanalId, hiloId, esAdministrador, alNavegar }: PropiedadesColumnaHilos) {
  const ruta = empresaId && canalId && subcanalId ? rutaHilos(empresaId, canalId, subcanalId) : null;
  const { datos, cargando, error, recargar } = useListaApi<Hilo>(ruta);
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
      alSeleccionar={(hilo) => alNavegar(`${rutaSubcanal}/${hilo.id}`)}
      alCrear={async (nombre) => {
        await crear(rutaHilos(empresaId, canalId, subcanalId), nombre);
        await recargar();
      }}
      alEliminar={async (hilo) => {
        await eliminarHilo(empresaId, canalId, subcanalId, hilo.id);
        await recargar();
        if (hilo.id === hiloId) alNavegar(rutaSubcanal);
      }}
      mensajeConfirmacion={(hilo) => `¿Estás seguro de que deseas eliminar el hilo "${hilo.nombre}"?`}
    />
  );
}