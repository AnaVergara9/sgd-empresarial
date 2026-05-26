"use client";

import { Usuario, Mensaje as TipoMensaje } from "@/types";
import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  orderBy,
  addDoc,
  serverTimestamp,
  query,
} from "firebase/firestore";

import Mensaje from "./Mensaje";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  empresaId: string;
  canalId: string | null;
  subcanalId: string | null;
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
  const [texto, setTexto] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [mensajeCitado, setMensajeCitado] = useState<TipoMensaje | null>(null);

  const finalRef = useRef<HTMLDivElement>(null);

  // 🌟 CORRECCIÓN 1: Ruta anidada real incluyendo el empresaId para que Firestore conecte bien
  const ruta = `empresas/${empresaId}/canales/${canalId}/subcanales/${subcanalId}/hilos/${hiloId}/mensajes`;

  // Escuchar mensajes en tiempo real
  useEffect(() => {
    if (!empresaId || !canalId || !subcanalId || !hiloId) return;

    const q = query(collection(db, ruta), orderBy("fecha", "asc"));

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as TipoMensaje[];

      setMensajes(data);
    });

    return () => unsub();
  }, [empresaId, canalId, subcanalId, hiloId, ruta]);

  // Autoscroll hacia abajo al recibir mensajes
  useEffect(() => {
    finalRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  // Enviar mensaje
  const enviarMensaje = async () => {
    if (!texto.trim() && !archivo) return;

    let archivoSubido = null;

    if (archivo) {
      archivoSubido = await subirArchivo(archivo);
    }

    // 🌟 CORRECCIÓN 2: Ajustamos los campos para que Mensaje.tsx reciba los datos exactos
    await addDoc(collection(db, ruta), {
      texto,
      autorId: datosUsuario.uid,
      autorNombre: datosUsuario.nombre,
      autorAvatar: datosUsuario.avatar || "", 
      autorAvatarColor: datosUsuario.avatarColor || "#5865f2", // Pasamos el avatar del usuario actual
      fecha: serverTimestamp(),
      archivos: archivoSubido ? [archivoSubido] : [],
      reacciones: {},
      respondidoA: mensajeCitado
        ? {
            autorNombre: mensajeCitado.autorNombre,
            texto: mensajeCitado.texto,
          }
        : null,
    });

    setTexto("");
    setArchivo(null);
    setMensajeCitado(null);
  };

  // Subir a Cloudinary
  const subirArchivo = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "chat_upload");

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`,
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await res.json();
      return {
        url: data.secure_url,
        nombre: file.name,
        tipo: file.type,
      };
    } catch (error) {
      console.error("Error al subir archivo:", error);
      return null;
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
        {mensajes.length === 0 ? (
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
            className="bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium px-4 h-8 rounded transition-colors text-xs"
          >
            Enviar
          </Button>
        </div>
      </div>
    </div>
  );
}