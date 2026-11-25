
import { ArchivoAdjunto, Mensaje, Usuario } from "@/types";
import { io } from "socket.io-client";

// API REST: continúa pasando por el Gateway.
const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

// Socket.IO pasa por Nginx, que distribuye la conexión entre las instancias del chat.
// En despliegues, VITE_SOCKET_URL debe apuntar al host público de ese balanceador.
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || "http://localhost:4004";

// Construye la ruta de mensajes de un hilo.
export const rutaMensajes = (
  empresaId: string,
  canalId: string,
  subcanalId: string,
  hiloId: string
) =>
  [
    "empresas",
    empresaId,
    "canales",
    canalId,
    "subcanales",
    subcanalId,
    "hilos",
    hiloId,
    "mensajes",
  ].join("/");

async function pedir<T = any>(
  url: string,
  opciones?: RequestInit
): Promise<T> {
  const res = await fetch(`${API}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...opciones,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Error en la petición");
  }

  return res.json();
}

// Extrae el identificador del hilo de la ruta.
const hiloIdDeRuta = (ruta: string) => {
  const partes = ruta.split("/");
  return partes[partes.length - 2];
};

// Adapta los documentos de MongoDB al formato que utiliza React.
function adaptarMensaje(m: any): Mensaje {
  const fecha = new Date(m.fecha);

  return {
    ...m,
    id: m.id || m._id,
    fecha: {
      toDate: () => fecha,
      toMillis: () => fecha.getTime(),
      seconds: Math.floor(fecha.getTime() / 1000),
      nanoseconds: 0,
    },
  } as unknown as Mensaje;
}

// Obtiene la fecha en milisegundos para ordenar los mensajes.
function obtenerTiempo(mensaje: Mensaje): number {
  const fecha = mensaje.fecha as any;

  if (typeof fecha?.toMillis === "function") {
    return fecha.toMillis();
  }

  if (typeof fecha?.toDate === "function") {
    return fecha.toDate().getTime();
  }

  return new Date(fecha).getTime();
}

/**
 * Escucha los mensajes de un hilo mediante Socket.IO.
 *
 * Primero carga los últimos 50 mensajes mediante HTTP.
 * Después recibe los nuevos mensajes mediante eventos.
 */
export function escucharMensajes(
  ruta: string,
  alCambiar: (mensajes: Mensaje[]) => void,
  alError: (error: Error) => void
) {
  const hiloId = hiloIdDeRuta(ruta);

  let activo = true;
  let mensajesActuales: Mensaje[] = [];

  // Evita perder mensajes que lleguen mientras se carga el historial.
  const integrarMensaje = (mensajeRecibido: any) => {
    if (!activo) return;

    const mensaje = adaptarMensaje(mensajeRecibido);

    const existe = mensajesActuales.some(
      (m) => m.id === mensaje.id
    );

    if (existe) {
      mensajesActuales = mensajesActuales.map((m) =>
        m.id === mensaje.id ? mensaje : m
      );
    } else {
      mensajesActuales = [...mensajesActuales, mensaje];
    }

    mensajesActuales.sort(
      (a, b) => obtenerTiempo(a) - obtenerTiempo(b)
    );

    alCambiar([...mensajesActuales]);
  };

  // La carga inicial se hace aunque Socket.IO aún esté conectando. Al reconectar,
  // volvemos a sincronizar por si el navegador perdió eventos mientras estuvo fuera.
  const cargarMensajes = async () => {
    try {
      const filas: any[] = await pedir(
        `/hilos/${encodeURIComponent(hiloId)}/mensajes`
      );

      if (!activo) return;

      filas.forEach(integrarMensaje);
    } catch (error: any) {
      if (activo) {
        alError(
          error instanceof Error
            ? error
            : new Error("Error al cargar mensajes")
        );
      }
    }
  };

  // Creamos la conexión Socket.IO.
  const socket = io(SOCKET_URL, {
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
  });

  // Cuando se conecta, entra a la sala y sincroniza el historial. Esta sincronización
  // también sirve si el primer HTTP falló mientras Socket.IO estaba conectando.
  socket.on("connect", () => {
    console.log("Socket.IO conectado:", socket.id);

    socket.emit("unirse-hilo", hiloId);

    cargarMensajes();
  });

  // Recibir mensajes nuevos.
  socket.on("nuevo-mensaje", (mensaje: any) => {
    console.log("Nuevo mensaje recibido:", mensaje);
    integrarMensaje(mensaje);
  });

  // Recibir mensajes actualizados, por ejemplo, por reacciones.
  socket.on("mensaje-actualizado", (mensaje: any) => {
    integrarMensaje(mensaje);
  });

  socket.on("connect_error", (error) => {
    console.error("Error de conexión Socket.IO:", error.message);
  });

  // Carga el historial aunque el socket todavía esté conectándose.
  cargarMensajes();

  // Limpieza cuando se cambia de hilo o se desmonta el componente.
  return () => {
    activo = false;

    socket.emit("salir-hilo", hiloId);

    socket.removeAllListeners();
    socket.disconnect();

    console.log("Socket.IO desconectado del hilo:", hiloId);
  };
}

// Sube el archivo al servicio de archivos por el gateway. El backend lo guarda
// en uploads local si Cloudinary no está configurado.
export async function subirArchivo(
  archivo: File
): Promise<ArchivoAdjunto> {
  const formData = new FormData();
  formData.append("archivo", archivo);

  const res = await fetch(`${API}/archivos`, {
    method: "POST",
    body: formData,
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.url) {
    throw new Error(data.error || "No se pudo subir el archivo");
  }

  return data as ArchivoAdjunto;
}

// Envía un mensaje mediante HTTP.
export async function enviarMensaje(
  ruta: string,
  autor: Usuario,
  texto: string,
  archivo: File | null,
  mensajeCitado: Mensaje | null,
  archivosDrive: ArchivoAdjunto[] = []
) {
  const archivoSubido = archivo
    ? await subirArchivo(archivo)
    : null;
  const archivos = [...(archivoSubido ? [archivoSubido] : []), ...archivosDrive];

  const mensaje = await pedir(
    `/hilos/${encodeURIComponent(hiloIdDeRuta(ruta))}/mensajes`,
    {
      method: "POST",
      body: JSON.stringify({
        texto,
        autorId: autor.uid,
        autorNombre: autor.nombre,
        autorAvatar: autor.avatar || "",
        autorAvatarColor: autor.avatarColor || "#5865f2",
        archivos,
        respondidoA: mensajeCitado
          ? {
              autorNombre: mensajeCitado.autorNombre,
              texto: mensajeCitado.texto,
            }
          : null,
      }),
    }
  );

  return mensaje;
}

// Agrega o quita una reacción mediante HTTP.
// El backend notificará el cambio mediante Socket.IO.
export async function alternarReaccion(
  _ruta: string,
  mensajeId: string,
  emoji: string,
  uid: string,
  _yaReacciono: boolean
) {
  return pedir(`/mensajes/${encodeURIComponent(mensajeId)}/reacciones`, {
    method: "POST",
    body: JSON.stringify({ emoji, uid }),
  });
}
