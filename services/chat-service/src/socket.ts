
import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";

let io: Server | null = null;

/**
 * Inicializa Socket.IO sobre el servidor HTTP.
 * Si existe REDIS_URL, conecta el adaptador para
 * compartir eventos entre las instancias del chat.
 */
export async function inicializarSocket(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin: process.env.SOCKET_CORS_ORIGIN
        ? process.env.SOCKET_CORS_ORIGIN.split(",")
        : true,
      methods: ["GET", "POST"],
    },
  });

  // Configuración opcional de Redis.
  // La activaremos mediante Docker Compose.
  if (process.env.REDIS_URL) {
    const pubClient = createClient({
      url: process.env.REDIS_URL,
    });

    const subClient = pubClient.duplicate();

    pubClient.on("error", (error) => {
      console.error("Error en Redis Publisher:", error);
    });

    subClient.on("error", (error) => {
      console.error("Error en Redis Subscriber:", error);
    });

    await Promise.all([
      pubClient.connect(),
      subClient.connect(),
    ]);

    io.adapter(createAdapter(pubClient, subClient));

    console.log("Redis Adapter conectado correctamente");
  }

  io.on("connection", (socket) => {
    console.log(`Usuario conectado: ${socket.id}`);

    // El usuario entra a la sala correspondiente a un hilo.
    socket.on("unirse-hilo", (hiloId: string) => {
      if (typeof hiloId !== "string" || !hiloId.trim()) {
        return;
      }

      socket.join(`hilo:${hiloId}`);
      console.log(`Socket ${socket.id} entró al hilo ${hiloId}`);
    });

    // El usuario sale de la sala.
    socket.on("salir-hilo", (hiloId: string) => {
      if (typeof hiloId !== "string" || !hiloId.trim()) {
        return;
      }

      socket.leave(`hilo:${hiloId}`);
      console.log(`Socket ${socket.id} salió del hilo ${hiloId}`);
    });

    socket.on("disconnect", () => {
      console.log(`Usuario desconectado: ${socket.id}`);
    });
  });

  return io;
}

/**
 * Emite un evento únicamente a los usuarios
 * conectados al hilo indicado.
 */
export function emitirEventoHilo(
  hiloId: string,
  evento: string,
  datos: unknown
) {
  if (!io) {
    console.warn("Socket.IO todavía no está inicializado");
    return;
  }

  io.to(`hilo:${hiloId}`).emit(evento, datos);
}
