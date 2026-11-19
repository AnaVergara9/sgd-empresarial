import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";

const PREFIJO_SALA_LLAMADA = "llamada:";
const MAX_PARTICIPANTES = 8;
type ResultadoUnion = { ok: true; participantes: string[] } | { ok: false; error: string };

function esUuid(valor: unknown): valor is string {
  return typeof valor === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(valor);
}

export async function inicializarSenalizacion(server: HttpServer) {
  const io = new Server(server, {
    cors: {
      origin: process.env.SOCKET_CORS_ORIGIN
        ? process.env.SOCKET_CORS_ORIGIN.split(",")
        : true,
      methods: ["GET", "POST"],
    },
  });

  if (process.env.REDIS_URL) {
    const publicador = createClient({ url: process.env.REDIS_URL });
    const suscriptor = publicador.duplicate();
    publicador.on("error", (error) => console.error("Redis publisher:", error));
    suscriptor.on("error", (error) => console.error("Redis subscriber:", error));
    await Promise.all([publicador.connect(), suscriptor.connect()]);
    io.adapter(createAdapter(publicador, suscriptor));
    console.log("Adaptador Redis conectado para señalización de llamadas");
  }

  io.on("connection", (socket) => {
    socket.on("unirse-hilo", (hiloId: unknown) => {
      if (esUuid(hiloId)) socket.join(`hilo:${hiloId}`);
    });

    socket.on("salir-hilo", (hiloId: unknown) => {
      if (esUuid(hiloId)) socket.leave(`hilo:${hiloId}`);
    });

    socket.on("llamada:unirse", async (hiloId: unknown, confirmar?: (resultado: ResultadoUnion) => void) => {
      if (!esUuid(hiloId)) {
        confirmar?.({ ok: false, error: "El identificador del hilo no es válido" });
        return;
      }

      const sala = `${PREFIJO_SALA_LLAMADA}${hiloId}`;
      try {
        const conectados = await io.in(sala).fetchSockets();
        const participantes = conectados.map((persona) => persona.id).filter((id) => id !== socket.id);
        if (!socket.rooms.has(sala) && conectados.length >= MAX_PARTICIPANTES) {
          confirmar?.({ ok: false, error: `La llamada admite hasta ${MAX_PARTICIPANTES} participantes` });
          return;
        }

        await socket.join(sala);
        confirmar?.({ ok: true, participantes });
        if (participantes.length > 0) socket.to(sala).emit("llamada:participante", { socketId: socket.id });
      } catch (error) {
        console.error("No se pudo unir a la sala de llamada:", error);
        confirmar?.({ ok: false, error: "No se pudo entrar a la llamada" });
      }
    });

    socket.on("llamada:invitar", (hiloId: unknown) => {
      if (!esUuid(hiloId) || !socket.rooms.has(`${PREFIJO_SALA_LLAMADA}${hiloId}`)) return;
      socket.to(`hilo:${hiloId}`).emit("llamada:entrante", { hiloId, socketId: socket.id });
    });

    socket.on("llamada:rechazar", (hiloId: unknown) => {
      if (esUuid(hiloId)) socket.to(`hilo:${hiloId}`).emit("llamada:rechazada", { hiloId, socketId: socket.id });
    });

    socket.on("llamada:senal", async (mensaje: { hiloId?: unknown; destinatarioId?: unknown; tipo?: unknown; datos?: unknown }) => {
      const { hiloId, destinatarioId, tipo, datos } = mensaje || {};
      if (
        !esUuid(hiloId) ||
        typeof destinatarioId !== "string" ||
        !["oferta", "respuesta", "candidato"].includes(String(tipo)) ||
        !datos || typeof datos !== "object" ||
        !socket.rooms.has(`${PREFIJO_SALA_LLAMADA}${hiloId}`)
      ) return;

      const sala = `${PREFIJO_SALA_LLAMADA}${hiloId}`;
      const participantes = await io.in(sala).fetchSockets();
      if (!participantes.some((participante) => participante.id === destinatarioId)) return;
      io.to(destinatarioId).emit("llamada:senal", {
        socketId: socket.id,
        tipo,
        datos,
      });
    });

    socket.on("llamada:estado-medios", (mensaje: { hiloId?: unknown; microfonoActivo?: unknown; camaraActiva?: unknown }) => {
      const { hiloId, microfonoActivo, camaraActiva } = mensaje || {};
      if (
        !esUuid(hiloId) ||
        typeof microfonoActivo !== "boolean" ||
        typeof camaraActiva !== "boolean" ||
        !socket.rooms.has(`${PREFIJO_SALA_LLAMADA}${hiloId}`)
      ) return;

      socket.to(`${PREFIJO_SALA_LLAMADA}${hiloId}`).emit("llamada:estado-medios", {
        socketId: socket.id,
        microfonoActivo,
        camaraActiva,
      });
    });

    socket.on("llamada:salir", (hiloId: unknown) => {
      if (!esUuid(hiloId)) return;
      const sala = `${PREFIJO_SALA_LLAMADA}${hiloId}`;
      if (!socket.rooms.has(sala)) return;
      socket.to(sala).emit("llamada:participante-salio", { socketId: socket.id });
      socket.to(`hilo:${hiloId}`).emit("llamada:cancelada", { hiloId, socketId: socket.id });
      socket.leave(sala);
    });

    socket.on("disconnecting", () => {
      for (const sala of socket.rooms) {
        if (!sala.startsWith(PREFIJO_SALA_LLAMADA)) continue;
        const hiloId = sala.slice(PREFIJO_SALA_LLAMADA.length);
        socket.to(sala).emit("llamada:participante-salio", { socketId: socket.id });
        socket.to(`hilo:${hiloId}`).emit("llamada:cancelada", { hiloId, socketId: socket.id });
      }
    });
  });

  return io;
}
