import { Usuario } from "@/types";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface PropiedadesEncabezado {
  datosUsuario: Usuario;
  alCerrarSesion: () => void;
}

export default function Encabezado({ datosUsuario, alCerrarSesion }: PropiedadesEncabezado) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="h-14 border-b border-discord-darkest bg-discord-dark flex items-center justify-between px-4 z-10 shrink-0">
      <div className="flex items-center gap-3">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
          style={{ backgroundColor: datosUsuario.avatarColor }}
        >
          {getInitials(datosUsuario.nombre)}
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-sm leading-tight">{datosUsuario.nombre}</span>
          <span className="text-discord-muted text-[11px] leading-tight">{datosUsuario.cargo}</span>
          <span className="text-discord-muted text-[11px] leading-tight">{datosUsuario.empresa}</span>
        </div>
      </div>
      
      <Button 
        variant="ghost" 
        onClick={alCerrarSesion}
        className="text-discord-muted hover:text-white hover:bg-discord-light gap-2 absolute top-2 right-4"
      >
        <LogOut className="w-4 h-4" />
        <span className="hidden sm:inline">Cerrar sesión</span>
      </Button>
    </header>
  );
}