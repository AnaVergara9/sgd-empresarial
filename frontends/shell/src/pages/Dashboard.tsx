import { lazy, Suspense, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthContext } from "@/features/auth/AuthContext";
import Encabezado from "@/features/auth/components/Encabezado";

// Se descargan desde mf-navegacion (puerto 5174) cuando hacen falta
const ColumnaCanales = lazy(() => import("mf_navegacion/ColumnaCanales"));
const ColumnaSubcanales = lazy(() => import("mf_navegacion/ColumnaSubcanales"));
const ColumnaHilos = lazy(() => import("mf_navegacion/ColumnaHilos"));
const ChatArea = lazy(() => import("mf_chat/ChatArea"));

export default function Dashboard() {
  const { datosUsuario, logout, cargando } = useAuthContext();
  const navigate = useNavigate();
  const { canalId = "", subcanalId = "", hiloId } = useParams();
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

  const empresaId = datosUsuario.empresa as string;
  const esAdministrador = datosUsuario.rol === "admin";

  return (
    <div className="flex flex-col h-screen bg-[#1e1f22] text-white overflow-hidden">
      <Encabezado datosUsuario={datosUsuario} alCerrarSesion={logout} />

      <div className="flex flex-1 overflow-hidden">
        <Suspense fallback={<p className="p-4 text-slate-400">Cargando navegación...</p>}>
          <ColumnaCanales
            empresaId={empresaId}
            canalId={canalId}
            esAdministrador={esAdministrador}
            alNavegar={navigate}
          />
          {canalId && (
            <ColumnaSubcanales
              empresaId={empresaId}
              canalId={canalId}
              subcanalId={subcanalId}
              esAdministrador={esAdministrador}
              alNavegar={navigate}
            />
          )}
          {canalId && subcanalId && (
            <ColumnaHilos
              empresaId={empresaId}
              canalId={canalId}
              subcanalId={subcanalId}
              hiloId={hiloId}
              esAdministrador={esAdministrador}
              alNavegar={navigate}
            />
          )}
        </Suspense>

        <main className="flex flex-1 overflow-hidden">
          {hiloId ? (
            <Suspense fallback={<p className="p-4 text-slate-400">Cargando chat...</p>}>
              <ChatArea
                empresaId={empresaId}
                canalId={canalId}
                subcanalId={subcanalId}
                hiloId={hiloId}
                datosUsuario={datosUsuario}
              />
            </Suspense>
          ) : (
            <p className="m-auto text-slate-400">Selecciona un hilo</p>
          )}
        </main>
      </div>
    </div>
  );
}