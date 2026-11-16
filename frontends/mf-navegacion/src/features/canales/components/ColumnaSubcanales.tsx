import type { Subcanal } from "@/types";
import { useListaApi } from "../useListaApi";
import { crear, eliminarSubcanal, rutaSubcanales } from "../canales.api";
import ColumnaNavegacion from "./ColumnaNavegacion";

interface PropiedadesColumnaSubcanales {
  empresaId: string;
  canalId: string;
  subcanalId: string;
  esAdministrador: boolean;
  alNavegar: (ruta: string) => void;
}

export default function ColumnaSubcanales({ empresaId, canalId, subcanalId, esAdministrador, alNavegar }: PropiedadesColumnaSubcanales) {
  const ruta = empresaId && canalId ? rutaSubcanales(empresaId, canalId) : null;
  const { datos, cargando, error, recargar } = useListaApi<Subcanal>(ruta);

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
      alSeleccionar={(subcanal) => alNavegar(`/dashboard/${empresaId}/${canalId}/${subcanal.id}`)}
      alCrear={async (nombre) => {
        await crear(rutaSubcanales(empresaId, canalId), nombre);
        await recargar();
      }}
      alEliminar={async (subcanal) => {
        await eliminarSubcanal(empresaId, canalId, subcanal.id);
        await recargar();
        if (subcanal.id === subcanalId) alNavegar(`/dashboard/${empresaId}/${canalId}`);
      }}
      mensajeConfirmacion={(subcanal) =>
        `¿Estás seguro de que deseas eliminar el subcanal "${subcanal.nombre}"? Se borrarán todos sus hilos y mensajes.`
      }
    />
  );
}