declare module "mf_navegacion/ColumnaCanales" {
  import type { ComponentType } from "react";
  const C: ComponentType<{
    empresaId: string;
    canalId: string;
    esAdministrador: boolean;
    alNavegar: (ruta: string) => void;
  }>;
  export default C;
}

declare module "mf_navegacion/ColumnaSubcanales" {
  import type { ComponentType } from "react";
  const C: ComponentType<{
    empresaId: string;
    canalId: string;
    subcanalId: string;
    esAdministrador: boolean;
    alNavegar: (ruta: string) => void;
  }>;
  export default C;
}

declare module "mf_navegacion/ColumnaHilos" {
  import type { ComponentType } from "react";
  const C: ComponentType<{
    empresaId: string;
    canalId: string;
    subcanalId: string;
    hiloId?: string;
    esAdministrador: boolean;
    alNavegar: (ruta: string) => void;
  }>;
  export default C;
}

declare module "mf_chat/ChatArea" {
  import type { ComponentType } from "react";
  import type { Usuario } from "@/types";
  const C: ComponentType<{
    empresaId: string;
    canalId: string;
    subcanalId: string;
    hiloId: string;
    datosUsuario: Usuario;
  }>;
  export default C;
}

declare module "mf_videollamada/VideoLlamada" {
  import type { ComponentType } from "react";
  const C: ComponentType<{ hiloId: string }>;
  export default C;
}
