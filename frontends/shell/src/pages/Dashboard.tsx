import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/features/auth/AuthContext";
import Encabezado from "@/features/auth/components/Encabezado";

// Provisional: aquí se montarán mf-navegacion y mf-chat
export default function Dashboard() {
  const { datosUsuario, logout, cargando } = useAuthContext();
  const navigate = useNavigate();
  const registroCompleto = !!datosUsuario?.empresa;

  useEffect(() => {
    if (!cargando && !registroCompleto) navigate("/login");
  }, [cargando, registroCompleto, navigate]);

  if (cargando || !datosUsuario || !registroCompleto) {
    return (
      <div className="min-h-screen bg-[#1e1f22] flex items-center justify-center text-white">
        <p className="animate-pulse">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#1e1f22] text-white overflow-hidden">
      <Encabezado datosUsuario={datosUsuario} alCerrarSesion={logout} />
      <main className="flex flex-1 items-center justify-center text-slate-400">
        Aquí irán la navegación y el chat (microfrontends)
      </main>
    </div>
  );
}