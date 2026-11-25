import { useEffect, useState } from "react";
import {
  cargarGoogleIdentityServices,
  convertirArchivoDrive,
  listarArchivosDrive,
  solicitarTokenDrive,
  type ArchivoDriveGoogle,
} from "@sgd/google-drive-local";

interface DriveArchivo {
  nombre: string;
  url: string;
  tipo: string;
  tamano?: string;
}

interface Props {
  alSeleccionar: (archivo: DriveArchivo) => void;
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

export default function DrivePicker({ alSeleccionar }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [archivos, setArchivos] = useState<ArchivoDriveGoogle[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [gisListo, setGisListo] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID) {
      return;
    }
    let activo = true;
    void cargarGoogleIdentityServices()
      .then(() => { if (activo) setGisListo(true); })
      .catch((causa: unknown) => {
        if (activo) setError(causa instanceof Error ? causa.message : "No se pudo cargar Google.");
      });
    return () => { activo = false; };
  }, []);

  const abrirDrive = () => {
    setAbierto(true);
    setError("");
    if (!CLIENT_ID) {
      setError("Falta configurar VITE_GOOGLE_CLIENT_ID para conectar Google Drive.");
      return;
    }

    if (!gisListo) {
      setError("Google todavía se está cargando. Cierra esta ventana e inténtalo de nuevo en unos segundos.");
      return;
    }

    setCargando(true);
    void solicitarTokenDrive(CLIENT_ID)
      .then(listarArchivosDrive)
      .then(setArchivos)
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Error conectando con Google Drive."))
      .finally(() => setCargando(false));
  };

  return (
    <>
      <button type="button" onClick={abrirDrive} title="Elegir archivo de Google Drive" className="rounded-lg px-3 py-2 text-sm text-sky-300 hover:bg-white/10">
        ☁️ Drive
      </button>
      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Elegir archivo de Google Drive">
          <div className="w-full max-w-xl rounded-xl border border-white/10 bg-[#25262a] p-5 text-white shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div><h2 className="text-lg font-semibold">Elegir de Google Drive</h2><p className="text-xs text-zinc-400">Se comparte un enlace al archivo; el archivo sigue en tu Drive.</p></div>
              <button type="button" onClick={() => setAbierto(false)} aria-label="Cerrar" className="rounded p-2 text-zinc-400 hover:bg-white/10">✕</button>
            </div>
            {cargando ? <p className="py-8 text-center text-zinc-300">Conectando con Drive…</p> : null}
            {error ? <p className="rounded-lg bg-rose-950/60 p-3 text-sm text-rose-200">{error}</p> : null}
            {!cargando && archivos.length === 0 && !error ? <p className="py-8 text-center text-zinc-400">No hay archivos para mostrar. Conecta tu cuenta de Google para continuar.</p> : null}
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {archivos.map((archivo) => (
                <button key={archivo.id} type="button" onClick={() => {
                  alSeleccionar(convertirArchivoDrive(archivo));
                  setAbierto(false);
                }} className="flex w-full items-center justify-between gap-3 rounded-lg bg-[#34363c] p-3 text-left hover:bg-[#41434a]">
                  <span className="min-w-0"><span className="block truncate text-sm">📄 {archivo.name}</span><span className="text-xs text-zinc-400">{archivo.mimeType}</span></span><span className="shrink-0 text-xs text-sky-300">Adjuntar</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
