"use client";

import { Usuario, Mensaje as TipoMensaje } from "@/types";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useState } from "react";

interface Props {
  mensaje: TipoMensaje;
  ruta: string;
  datosUsuario: Usuario;
  alResponder: (mensaje: TipoMensaje) => void;
}

export default function Mensaje({ mensaje, ruta, datosUsuario, alResponder }: Props) {
  const [mostrarEmojiMenu, setMostrarEmojiMenu] = useState(false);

  // 1. Obtener las iniciales del nombre (ej: Paula Cubillos -> PC)
  const obtenerIniciales = (nombre: string) => {
    if (!nombre) return "?";
    return nombre
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // 2. Formatear la fecha y hora de Firebase de forma humana
  const formatearFecha = (timestamp: any) => {
    if (!timestamp) return "Enviando...";
    const fechaObjeto = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    return fechaObjeto.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

  // 3. Función para reaccionar a un mensaje
  const reaccionar = async (emoji: string) => {
    try {
      const mensajeRef = doc(db, ruta, mensaje.id);
      const reaccionesActuales = { ...mensaje.reacciones };
      const miId = datosUsuario.uid;

      if (!reaccionesActuales[emoji]) {
        reaccionesActuales[emoji] = [];
      }

      // Si ya reaccioné con este emoji, me quito; si no, me agrego
      if (reaccionesActuales[emoji].includes(miId)) {
        reaccionesActuales[emoji] = reaccionesActuales[emoji].filter((id) => id !== miId);
      } else {
        reaccionesActuales[emoji].push(miId);
      }

      // Si nadie más tiene ese emoji, lo borramos de la lista
      if (reaccionesActuales[emoji].length === 0) {
        delete reaccionesActuales[emoji];
      }

      await updateDoc(mensajeRef, { reacciones: reaccionesActuales });
      setMostrarEmojiMenu(false);
    } catch (error) {
      console.error("Error al reaccionar:", error);
    }
  };

  // Saber si el mensaje lo escribí yo misma
  const esMio = mensaje.autorId === datosUsuario.uid;

  return (
    <div 
      className={`group flex items-start gap-3 w-full max-w-[85%] md:max-w-[70%] transition-all ${
        esMio ? "ml-auto flex-row-reverse" : "mr-auto"
      }`}
    >
      {/* AVATAR: Círculo con iniciales usando su color aleatorio de Firestore */}
      <div 
        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md shrink-0 uppercase"
        style={{ backgroundColor: (mensaje as any).autorAvatarColor || "#5865f2" }}
      >
        {obtenerIniciales(mensaje.autorNombre)}
      </div>

      {/* CONTENIDO DEL MENSAJE */}
      <div className="flex flex-col space-y-1 w-full">
        
        {/* INFORMACIÓN DE CABECERA (Nombre y Hora) */}
        <div className={`flex items-center gap-2 text-xs ${esMio ? "justify-end flex-row-reverse" : ""}`}>
          <span className="font-semibold text-zinc-200">{mensaje.autorNombre}</span>
          <span className="text-zinc-500 text-[10px]">{formatearFecha(mensaje.fecha)}</span>
        </div>

        {/* BURBUJA DEL CHAT (Estilo WhatsApp/Discord) */}
        <div className="relative group/bubble">
          
          {/* Si el mensaje responde a otro (Cita) */}
          {mensaje.respondidoA && (
            <div className="bg-black/20 text-xs p-2 rounded-t-md border-l-4 border-indigo-500 text-zinc-400 mb-[-4px] italic max-w-xs truncate">
              📌 {mensaje.respondidoA.autorNombre}: "{mensaje.respondidoA.texto}"
            </div>
          )}

          <div 
            className={`p-3 text-sm leading-relaxed shadow-md ${
              mensaje.respondidoA ? "rounded-b-xl" : "rounded-xl"
            } ${
              esMio 
                ? "bg-[#005c4b] text-white rounded-tr-none" // Verde WhatsApp si es mío
                : "bg-[#202c33] text-zinc-100 rounded-tl-none" // Gris oscuro si es de otros
            }`}
          >
            <p className="whitespace-pre-wrap break-words">{mensaje.texto}</p>

            {/* Dibujar archivos adjuntos si existen */}
            {mensaje.archivos && mensaje.archivos.map((arch: any, i: number) => (
              <div key={i} className="mt-2 p-2 bg-black/20 rounded-lg flex items-center justify-between gap-4 border border-white/5">
                <span className="text-xs text-zinc-300 truncate max-w-[180px]">📎 {arch.nombre}</span>
                <a 
                  href={arch.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-xs text-sky-400 hover:underline shrink-0 font-medium"
                >
                  Descargar
                </a>
              </div>
            ))}
          </div>

          {/* MENÚ FLOTANTE DE ACCIONES (Sale al pasar el mouse por encima) */}
          <div className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 bg-[#232428] border border-zinc-700 rounded-lg shadow-xl px-1 py-0.5 opacity-0 group-hover/bubble:opacity-100 transition-opacity z-10 ${
            esMio ? "left-0 -translate-x-[110%]" : "right-0 translate-x-[110%]"
          }`}>
            <button 
              onClick={() => setMostrarEmojiMenu(!mostrarEmojiMenu)}
              className="hover:bg-white/10 p-1.5 rounded text-sm" 
              title="Reaccionar"
            >
              😀
            </button>
            <button 
              onClick={() => alResponder(mensaje)}
              className="hover:bg-white/10 p-1.5 rounded text-sm text-zinc-400 hover:text-white"
              title="Responder"
            >
              ↩️
            </button>
          </div>

          {/* VENTANA EMERGENTE DE REACCIONES (Mini Menú de Animación) */}
          {mostrarEmojiMenu && (
            <div className={`absolute bottom-full mb-2 bg-[#1e1f22] border border-zinc-700 p-2 rounded-full shadow-2xl flex gap-2 z-20 animate-bounce ${
              esMio ? "left-0" : "right-0"
            }`}>
              {["👍", "❤️", "😂", "😮", "😢", "🙏"].map((emoji) => (
                <button 
                  key={emoji} 
                  onClick={() => reaccionar(emoji)}
                  className="hover:scale-130 transition-transform text-base p-1"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* VISUALIZADOR DE REACCIONES DEBAJO DEL MENSAJE */}
        {mensaje.reacciones && Object.keys(mensaje.reacciones).length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${esMio ? "justify-end" : ""}`}>
            {Object.entries(mensaje.reacciones).map(([emoji, usuarios]: [string, any]) => (
              <button
                key={emoji}
                onClick={() => reaccionar(emoji)}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs border border-transparent transition-colors ${
                  usuarios.includes(datosUsuario.uid)
                    ? "bg-[#5865f2]/20 border-[#5865f2] text-white"
                    : "bg-[#2b2d31] text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                <span>{emoji}</span>
                <span className="text-[10px] font-bold">{usuarios.length}</span>
              </button>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}