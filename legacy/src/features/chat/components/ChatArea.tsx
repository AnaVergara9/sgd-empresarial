"use client";

import { Usuario, Mensaje as TipoMensaje } from "@/types";
import { useState, useEffect, useRef } from "react";
import { rutaMensajes } from "@/features/canales/canales.api";
import { enviarMensaje as enviarMensajeApi, escucharMensajes } from "../chat.api";

import Mensaje from "./Mensaje";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";

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
  const [errorCarga, setErrorCarga] = useState(false);
  const [texto, setTexto] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [mensajeCitado, setMensajeCitado] = useState<TipoMensaje | null>(null);
  const [enviando, setEnviando] = useState(false);

  const finalRef = useRef<HTMLDivElement>(null);

  const ruta = rutaMensajes(empresaId, canalId, subcanalId, hiloId).join("/");

  // Escuchar los últimos mensajes en tiempo real
  useEffect(() => {
    if (!empresaId || !canalId || !subcanalId || !hiloId) return;
    setErrorCarga(false);

    return escucharMensajes(ruta, setMensajes, (error) => {
      console.error("Error al cargar mensajes:", error);
      setErrorCarga(true);
    });
  }, [empresaId, canalId, subcanalId, hiloId, ruta]);

  // Autoscroll hacia abajo solo cuando llega un mensaje nuevo (no al reaccionar a uno viejo)
  const ultimoId = mensajes[mensajes.length - 1]?.id;
  useEffect(() => {
    finalRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ultimoId]);

  // Enviar mensaje
  const enviarMensaje = async () => {
    if (enviando || (!texto.trim() && !archivo)) return;

    setEnviando(true);
    try {
      await enviarMensajeApi(ruta, datosUsuario, texto, archivo, mensajeCitado);
      setTexto("");
      setArchivo(null);
      setMensajeCitado(null);
    } catch (error) {
      // No limpiamos el texto para que el usuario pueda reintentar
      console.error("Error al enviar mensaje:", error);
      alert("No se pudo enviar el mensaje. Revisa tu conexión o el archivo adjunto e inténtalo de nuevo.");
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
        {errorCarga ? (
          <div className="h-full flex items-center justify-center text-rose-400 text-sm">
            <p>No se pudieron cargar los mensajes.</p>
          </div>
        ) : mensajes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-sm">
            <span className="text-4xl mb-2">💬</span>
            <p>Este es el inicio de la conversación. ¡Escribe el primer mensaje!</p>
          </div>
        ) : (
          mensajes.map((m) => (
            <Mensaje
              key={m.id}
              mensaje={m}
              ruta={ruta}
              datosUsuario={datosUsuario}
              alResponder={setMensajeCitado}
            />
          ))
        )}
        <div ref={finalRef} />
      </div>

      {/* NOTIFICACIÓN DE ARCHIVO SELECCIONADO O CITA */}
      {archivo && (
        <div className="px-4 py-2 bg-[#2b2d31] border-t border-white/5 flex items-center justify-between text-xs text-emerald-400">
          <span>📎 Archivo listo para enviar: <strong>{archivo.name}</strong></span>
          <button onClick={() => setArchivo(null)} className="text-zinc-400 hover:text-white">✕</button>
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
            {enviando ? "Enviando..." : "Enviar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
