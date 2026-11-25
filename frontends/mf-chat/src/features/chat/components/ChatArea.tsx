
import { Usuario, Mensaje as TipoMensaje, ArchivoAdjunto } from "@/types";
import { useState, useEffect, useRef, useMemo } from "react";
import { rutaMensajes, colaMensajes, type MensajePendiente } from "../chat.api";
import { enviarMensaje as enviarMensajeApi, escucharMensajes } from "../chat.api";

import Mensaje from "./Mensaje";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import DrivePicker from "./DrivePicker";

// Convierte un envío de la cola local en un mensaje que se puede dibujar.
// El adjunto se muestra desde el propio navegador con una URL blob: (no necesita internet).
function pendienteAMensaje(p: MensajePendiente, urls: string[]): TipoMensaje {
  const fecha = new Date(p.creadoEn);
  const archivos: TipoMensaje["archivos"] = [];

  if (p.datos.archivoSubido) {
    archivos.push(p.datos.archivoSubido);
  } else if (p.archivo) {
    const url = URL.createObjectURL(p.archivo.blob);
    urls.push(url);
    archivos.push({
      nombre: p.archivo.nombre,
      url,
      tipo: p.archivo.tipo,
      tamano: `${Math.max(1, Math.round(p.archivo.tamano / 1024))} KB`,
    });
  }
  // Enlaces de Google Drive del mensaje pendiente
  archivos.push(...(p.datos.archivosExtra ?? []));

  return {
    id: p.id,
    idCliente: p.id,
    texto: p.datos.texto,
    autorId: p.datos.autorId,
    autorNombre: p.datos.autorNombre,
    autorAvatar: p.datos.autorAvatar,
    autorAvatarColor: p.datos.autorAvatarColor,
    fecha: {
      toDate: () => fecha,
      toMillis: () => fecha.getTime(),
      seconds: Math.floor(fecha.getTime() / 1000),
      nanoseconds: 0,
    },
    archivos,
    reacciones: {},
    respondidoA: p.datos.respondidoA,
    estadoLocal: p.estado,
    errorLocal: p.ultimoError,
  };
}

// Funciones estables (no cambian entre renders) para no romper el memo de <Mensaje>.
const reintentarPendiente = (id: string) => {
  colaMensajes.reintentar(id).catch((e) => console.error("No se pudo reintentar:", e));
};
const descartarPendiente = (id: string) => {
  if (!window.confirm("¿Descartar este mensaje? No se enviará.")) return;
  colaMensajes.descartar(id).catch((e) => console.error("No se pudo descartar:", e));
};

interface Props {
  empresaId: string;
  canalId: string;
  subcanalId: string;
  hiloId: string;
  datosUsuario: Usuario;
}

export default function ChatArea({
  empresaId,
  canalId,
  subcanalId,
  hiloId,
  datosUsuario,
}: Props) {
  const [mensajes, setMensajes] = useState<TipoMensaje[]>([]);
  const [pendientes, setPendientes] = useState<TipoMensaje[]>([]);
  const [errorCarga, setErrorCarga] = useState(false);
  const [texto, setTexto] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [archivosDrive, setArchivosDrive] = useState<ArchivoAdjunto[]>([]);
  const [mensajeCitado, setMensajeCitado] = useState<TipoMensaje | null>(null);
  const [enviando, setEnviando] = useState(false);

  const finalRef = useRef<HTMLDivElement>(null);
  const urlsLocalesRef = useRef<string[]>([]);

  const ruta = rutaMensajes(empresaId, canalId, subcanalId, hiloId);
  const uid = datosUsuario.uid;

  // Escuchar los últimos mensajes en tiempo real
  useEffect(() => {
    if (!empresaId || !canalId || !subcanalId || !hiloId) return;
    setErrorCarga(false);
    setMensajes([]); // no mostrar los mensajes del hilo anterior mientras carga este

    return escucharMensajes(
      ruta,
      (lista) => {
        setMensajes(lista);
        setErrorCarga(false);
      },
      (error) => {
        console.error("Error al cargar mensajes:", error);
        setErrorCarga(true);
      },
      // Al (re)conectar con el servidor se envía lo que quedó en la cola local
      () => void colaMensajes.sincronizar(uid)
    );
  }, [empresaId, canalId, subcanalId, hiloId, ruta, uid]);

  // Módulo local: sincroniza la cola de esta cuenta al abrir, al volver la red y cada 15 s
  useEffect(() => colaMensajes.iniciar(uid), [uid]);

  // Módulo local: muestra los mensajes de esta cuenta que siguen guardados en el navegador
  useEffect(() => {
    let consulta = 0;

    const refrescar = async () => {
      const numero = ++consulta;
      try {
        const lista = await colaMensajes.listar(uid, hiloId);
        if (numero !== consulta) return; // ya llegó una consulta más nueva
        const urls: string[] = [];
        const convertidos = lista.map((p) => pendienteAMensaje(p, urls));
        urlsLocalesRef.current.forEach((u) => URL.revokeObjectURL(u));
        urlsLocalesRef.current = urls;
        setPendientes(convertidos);
      } catch (error) {
        console.error("No se pudo leer la cola local:", error);
      }
    };

    refrescar();
    const dejarDeEscuchar = colaMensajes.suscribir(refrescar);

    return () => {
      consulta++;
      dejarDeEscuchar();
      urlsLocalesRef.current.forEach((u) => URL.revokeObjectURL(u));
      urlsLocalesRef.current = [];
      setPendientes([]);
    };
  }, [uid, hiloId]);

  // Mensajes del servidor + pendientes que el servidor todavía no ha confirmado
  const mensajesVisibles = useMemo(() => {
    const confirmados = new Set(mensajes.map((m) => m.idCliente).filter(Boolean));
    return [...mensajes, ...pendientes.filter((p) => !confirmados.has(p.id))];
  }, [mensajes, pendientes]);

  const cantidadPendientes = pendientes.filter((p) => p.estadoLocal !== "error").length;

  // Autoscroll hacia abajo solo cuando llega un mensaje nuevo (no al reaccionar a uno viejo)
  const ultimoId = mensajesVisibles[mensajesVisibles.length - 1]?.id;
  useEffect(() => {
    finalRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ultimoId]);

  // Enviar mensaje
  const enviarMensaje = async () => {
    if (enviando || (!texto.trim() && !archivo && archivosDrive.length === 0)) return;

    setEnviando(true);
    try {
      // Queda guardado en el navegador aunque no haya conexión; el módulo local lo envía después
      await enviarMensajeApi(ruta, datosUsuario, texto, archivo, mensajeCitado, archivosDrive);
      setTexto("");
      setArchivo(null);
      setArchivosDrive([]);
      setMensajeCitado(null);
    } catch (error) {
      // Solo falla si el navegador no pudo guardar el mensaje (por ejemplo, sin espacio)
      console.error("Error al guardar el mensaje:", error);
      alert("No se pudo guardar el mensaje en este equipo. Inténtalo de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#313338] h-full overflow-hidden">

      {/* SECCIÓN DE MENSAJES (Estilo Discord/WhatsApp) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0b141a] bg-opacity-95 relative"
           style={{
             backgroundImage: `radial-gradient(rgba(255,255,255,0.03) 1px, transparent 0)`,
             backgroundSize: '24px 24px'
           }}>
        {errorCarga && (
          <div className="sticky top-0 z-10 rounded-md bg-amber-500/15 border border-amber-500/30 px-3 py-2 text-xs text-amber-300">
            Sin conexión con el servidor. Ves los mensajes guardados en este equipo; lo que envíes se enviará al reconectar.
          </div>
        )}
        {mensajesVisibles.length === 0 ? (
          !errorCarga && (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-sm">
              <span className="text-4xl mb-2">💬</span>
              <p>Este es el inicio de la conversación. ¡Escribe el primer mensaje!</p>
            </div>
          )
        ) : (
          mensajesVisibles.map((m) => (
            <Mensaje
              key={m.id}
              mensaje={m}
              ruta={ruta}
              datosUsuario={datosUsuario}
              alResponder={setMensajeCitado}
              alReintentar={reintentarPendiente}
              alDescartar={descartarPendiente}
            />
          ))
        )}
        <div ref={finalRef} />
      </div>

      {/* MÓDULO LOCAL: mensajes guardados en este equipo esperando conexión */}
      {cantidadPendientes > 0 && (
        <div className="px-4 py-1.5 bg-[#2b2d31] border-t border-white/5 text-xs text-amber-300">
          ⏳ {cantidadPendientes === 1 ? "1 mensaje pendiente guardado" : `${cantidadPendientes} mensajes pendientes guardados`} en este equipo. Se enviarán al recuperar la conexión.
        </div>
      )}

      {/* NOTIFICACIÓN DE ARCHIVO SELECCIONADO O CITA */}
      {archivo && (
        <div className="px-4 py-2 bg-[#2b2d31] border-t border-white/5 flex items-center justify-between text-xs text-emerald-400">
          <span>📎 Archivo listo para enviar: <strong>{archivo.name}</strong></span>
          <button onClick={() => setArchivo(null)} className="text-zinc-400 hover:text-white">✕</button>
        </div>
      )}

      {archivosDrive.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-white/5 bg-[#2b2d31] px-4 py-2">
          {archivosDrive.map((item) => <span key={item.url} className="rounded-full bg-sky-950/60 px-3 py-1 text-xs text-sky-200">☁️ {item.nombre} <button type="button" onClick={() => setArchivosDrive((actuales) => actuales.filter((archivoDrive) => archivoDrive.url !== item.url))} aria-label={`Quitar ${item.nombre}`}>✕</button></span>)}
        </div>
      )}

      {mensajeCitado && (
        <div className="px-4 py-2 bg-[#2b2d31] border-t border-white/5 flex items-center justify-between text-xs text-indigo-400">
          <span>Replying to <strong>{mensajeCitado.autorNombre}</strong></span>
          <button onClick={() => setMensajeCitado(null)} className="text-zinc-400 hover:text-white">✕</button>
        </div>
      )}

      {/* BARRA DE ENTRADA DE TEXTO (INPUT) */}
      <div className="p-4 bg-[#313338] border-t border-white/10">
        <div className="flex items-center gap-2 bg-[#383a40] rounded-lg px-3 py-1">

          {/* Botón de archivo estilizado como un clip elegante */}
          <label className="cursor-pointer text-zinc-400 hover:text-zinc-200 transition-colors p-2">
            <span className="text-xl">📎</span>
            <input
              type="file"
              className="hidden" // Escondemos el input feo nativo
              onChange={(e) => setArchivo(e.target.files?.[0] || null)}
            />
          </label>
          <DrivePicker alSeleccionar={(nuevoArchivo) => setArchivosDrive((actuales) => actuales.some((item) => item.url === nuevoArchivo.url) ? actuales : [...actuales, nuevoArchivo])} />

          {/* Campo de texto estilizado */}
          <Input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && enviarMensaje()}
            placeholder="Escribe un mensaje aquí..."
            className="flex-1 bg-transparent border-none text-white placeholder-zinc-500 focus-visible:ring-0 focus-visible:ring-offset-0 h-10"
          />

          {/* Botón enviar */}
          <Button
            onClick={enviarMensaje}
            disabled={enviando}
            className="bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium px-4 h-8 rounded transition-colors text-xs"
          >
            {enviando ? "Guardando..." : "Enviar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
