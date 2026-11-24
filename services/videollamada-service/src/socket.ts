import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";

const PREFIJO_SALA_LLAMADA = "llamada:";
const MAX_PARTICIPANTES = 8;
type ResultadoUnion = { ok: true; participantes: string[] } | { ok: false; error: string };
type MiembroHilo = { uid: string; nombre: string; cargo?: string };
type EstadoLlamada = { ownerUid: string; uidsPermitidos: Set<string> };

function esUuid(valor: unknown): valor is string {
  return typeof valor === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(valor);
}

export async function inicializarSenalizacion(server: HttpServer) {
  const llamadasActivas = new Map<string, EstadoLlamada>();
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
    socket.on("unirse-hilo", (datos: unknown) => {
      const entrada = typeof datos === "string" ? { hiloId: datos } : datos as { hiloId?: unknown; uid?: unknown; nombre?: unknown; cargo?: unknown };
      if (!esUuid(entrada?.hiloId) || typeof entrada.uid !== "string" || !entrada.uid.trim()) return;
      socket.data.uid = entrada.uid.trim();
      socket.data.nombre = typeof entrada.nombre === "string" && entrada.nombre.trim() ? entrada.nombre.trim() : "Usuario";
      socket.data.cargo = typeof entrada.cargo === "string" ? entrada.cargo : "";
      socket.data.hiloId = entrada.hiloId;
      socket.join(`hilo:${entrada.hiloId}`);
    });

    socket.on("salir-hilo", (hiloId: unknown) => {
      if (esUuid(hiloId)) {
        socket.leave(`hilo:${hiloId}`);
        if (socket.data.hiloId === hiloId) socket.data.hiloId = undefined;
      }
    });

    socket.on("llamada:miembros", async (hiloId: unknown, confirmar?: (resultado: { ok: boolean; miembros?: MiembroHilo[]; error?: string }) => void) => {
      if (!esUuid(hiloId) || socket.data.hiloId !== hiloId || !socket.rooms.has(`hilo:${hiloId}`)) {
        confirmar?.({ ok: false, error: "No estás conectado a este hilo" });
        return;
      }
      try {
        const sockets = await io.in(`hilo:${hiloId}`).fetchSockets();
        const miembros = new Map<string, MiembroHilo>();
        for (const conectado of sockets) {
          const uid = conectado.data.uid;
          if (typeof uid !== "string" || !uid || uid === socket.data.uid || miembros.has(uid)) continue;
          miembros.set(uid, { uid, nombre: conectado.data.nombre || "Usuario", cargo: conectado.data.cargo || "" });
        }
        confirmar?.({ ok: true, miembros: [...miembros.values()] });
      } catch (error) {
        console.error("No se pudieron consultar los miembros del hilo:", error);
        confirmar?.({ ok: false, error: "No se pudieron cargar las personas del hilo" });
      }
    });

    socket.on("llamada:iniciar", async (datos: { hiloId?: unknown; invitados?: unknown }, confirmar?: (resultado: ResultadoUnion) => void) => {
      const hiloId = datos?.hiloId;
      const invitados = Array.isArray(datos?.invitados) ? [...new Set(datos.invitados.filter((uid): uid is string => typeof uid === "string" && uid.trim()).map((uid) => uid.trim()))] : [];
      if (!esUuid(hiloId) || socket.data.hiloId !== hiloId || !socket.rooms.has(`hilo:${hiloId}`) || typeof socket.data.uid !== "string") {
        confirmar?.({ ok: false, error: "No estás conectado a este hilo" });
        return;
      }
      if (llamadasActivas.has(hiloId)) {
        confirmar?.({ ok: false, error: "Ya hay una videollamada activa en este hilo" });
        return;
      }
      if (invitados.length === 0 || invitados.length > MAX_PARTICIPANTES - 1 || invitados.includes(socket.data.uid)) {
        confirmar?.({ ok: false, error: `Selecciona entre 1 y ${MAX_PARTICIPANTES - 1} personas` });
        return;
      }

      try {
        const socketsHilo = await io.in(`hilo:${hiloId}`).fetchSockets();
        const miembrosConectados = new Set(socketsHilo.map((persona) => persona.data.uid).filter((uid): uid is string => typeof uid === "string"));
        if (invitados.some((uid) => !miembrosConectados.has(uid))) {
          confirmar?.({ ok: false, error: "Una de las personas seleccionadas ya no está conectada al hilo" });
          return;
        }

        const permitidos = new Set([socket.data.uid, ...invitados]);
        llamadasActivas.set(hiloId, { ownerUid: socket.data.uid, uidsPermitidos: permitidos });
        await socket.join(`${PREFIJO_SALA_LLAMADA}${hiloId}`);
        confirmar?.({ ok: true, participantes: [] });

        for (const persona of socketsHilo) {
          if (invitados.includes(persona.data.uid)) {
            io.to(persona.id).emit("llamada:entrante", {
              hiloId,
              socketId: socket.id,
              nombre: socket.data.nombre,
            });
          }
        }
      } catch (error) {
        llamadasActivas.delete(hiloId);
        console.error("No se pudo iniciar la videollamada:", error);
        confirmar?.({ ok: false, error: "No se pudo iniciar la videollamada" });
      }
    });

    socket.on("llamada:unirse", async (hiloId: unknown, confirmar?: (resultado: ResultadoUnion) => void) => {
      if (!esUuid(hiloId)) {
        confirmar?.({ ok: false, error: "El identificador del hilo no es válido" });
        return;
      }

      const sala = `${PREFIJO_SALA_LLAMADA}${hiloId}`;
      try {
        const llamada = llamadasActivas.get(hiloId);
        if (!llamada || socket.data.hiloId !== hiloId || typeof socket.data.uid !== "string" || !llamada.uidsPermitidos.has(socket.data.uid)) {
          confirmar?.({ ok: false, error: "El dueño de la llamada no te invitó" });
          return;
        }
        const conectados = await io.in(sala).fetchSockets();
        if (conectados.some((persona) => persona.data.uid === socket.data.uid && persona.id !== socket.id)) {
          confirmar?.({ ok: false, error: "Esta cuenta ya está en la llamada desde otra ventana" });
          return;
        }
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

    socket.on("llamada:salir", async (hiloId: unknown) => {
      if (!esUuid(hiloId)) return;
      const sala = `${PREFIJO_SALA_LLAMADA}${hiloId}`;
      if (!socket.rooms.has(sala)) return;
      socket.to(sala).emit("llamada:participante-salio", { socketId: socket.id });
      socket.to(`hilo:${hiloId}`).emit("llamada:cancelada", { hiloId, socketId: socket.id });
      await socket.leave(sala);
      if ((await io.in(sala).fetchSockets()).length === 0) llamadasActivas.delete(hiloId);
    });

    socket.on("disconnecting", () => {
      for (const sala of socket.rooms) {
        if (!sala.startsWith(PREFIJO_SALA_LLAMADA)) continue;
        const hiloId = sala.slice(PREFIJO_SALA_LLAMADA.length);
        socket.to(sala).emit("llamada:participante-salio", { socketId: socket.id });
        socket.to(`hilo:${hiloId}`).emit("llamada:cancelada", { hiloId, socketId: socket.id });
      }
    });

    socket.on("disconnect", async () => {
      for (const hiloId of llamadasActivas.keys()) {
        if ((await io.in(`${PREFIJO_SALA_LLAMADA}${hiloId}`).fetchSockets()).length === 0) llamadasActivas.delete(hiloId);
      }
    });
  });

  return io;
}
