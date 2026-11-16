import type { Canal } from "@/types";
import { useListaApi } from "../useListaApi";
import { crear, eliminarCanal, rutaCanales } from "../canales.api";
import ColumnaNavegacion from "./ColumnaNavegacion";

interface PropiedadesColumnaCanales {
  empresaId: string;
  canalId: string;
  esAdministrador: boolean;
  alNavegar: (ruta: string) => void;
}

export default function ColumnaCanales({ empresaId, canalId, esAdministrador, alNavegar }: PropiedadesColumnaCanales) {
  const { datos, cargando, error, recargar } = useListaApi<Canal>(empresaId ? rutaCanales(empresaId) : null);

  return (
    <ColumnaNavegacion
      titulo="CANALES"
      nombreElemento="canal"
      icono="#"
      claseActiva="bg-white/10 text-white"
      elementos={datos}
      cargando={cargando}
      error={error}
      idActivo={canalId}
      esAdministrador={esAdministrador}
      alSeleccionar={(canal) => alNavegar(`/dashboard/${empresaId}/${canal.id}`)}
      alCrear={async (nombre) => {
        await crear(rutaCanales(empresaId), nombre);
        await recargar();
      }}
      alEliminar={async (canal) => {
        await eliminarCanal(empresaId, canal.id);
        await recargar();
        if (canal.id === canalId) alNavegar(`/dashboard/${empresaId}`);
      }}
      mensajeConfirmacion={(canal) =>
        `¿¡CUIDADO!? ¿Estás segura de que deseas eliminar el canal "${canal.nombre}"?\nEsto borrará permanentemente todos sus subcanales, hilos y mensajes.`
      }
    />
  );
}