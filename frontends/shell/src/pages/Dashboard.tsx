import { lazy, Suspense, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthContext } from "@/features/auth/AuthContext";
import Encabezado from "@/features/auth/components/Encabezado";

// Se descargan desde mf-navegacion (puerto 5174) cuando hacen falta
const ColumnaCanales = lazy(() => import("mf_navegacion/ColumnaCanales"));
const ColumnaSubcanales = lazy(() => import("mf_navegacion/ColumnaSubcanales"));
const ColumnaHilos = lazy(() => import("mf_navegacion/ColumnaHilos"));
const ChatArea = lazy(() => import("mf_chat/ChatArea"));
const VideoLlamada = lazy(() => import("mf_videollamada/VideoLlamada"));

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

        <main className="flex min-w-0 flex-1 overflow-hidden">
          {hiloId ? (
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              <div className="flex min-h-[68px] items-center justify-between gap-3 border-b border-white/10 bg-[#25262a] px-4 py-3 sm:px-6">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">Espacio del hilo</p>
                  <p className="text-xs text-slate-400">Chat y videollamada en el mismo canal</p>
                </div>
                <Suspense fallback={<span className="text-xs text-slate-400">Cargando llamada…</span>}>
                  <VideoLlamada
                    hiloId={hiloId}
                    usuarioUid={datosUsuario.uid}
                    usuarioNombre={datosUsuario.nombre}
                    usuarioCargo={datosUsuario.cargo}
                  />
                </Suspense>
              </div>
              <Suspense fallback={<p className="p-4 text-slate-400">Cargando chat...</p>}>
                <ChatArea
                  empresaId={empresaId}
                  canalId={canalId}
                  subcanalId={subcanalId}
                  hiloId={hiloId}
                  datosUsuario={datosUsuario}
                />
              </Suspense>
            </div>
          ) : (
            <p className="m-auto text-slate-400">Selecciona un hilo</p>
          )}
        </main>
      </div>
    </div>
  );
}
