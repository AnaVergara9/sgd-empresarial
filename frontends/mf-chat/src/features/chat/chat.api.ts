
import { ArchivoAdjunto, Mensaje, Usuario } from "@/types";
import { io } from "socket.io-client";
import {
  crearColaOffline,
  ErrorPermanente,
  esEstadoPermanente,
  guardarCache,
  leerCache,
  type Pendiente,
  type PendienteVisible,
} from "@local-module";

// API REST: continúa pasando por el Gateway.
const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

// Socket.IO pasa por Nginx, que distribuye la conexión entre las instancias del chat.
// En despliegues, VITE_SOCKET_URL debe apuntar al host público de ese balanceador.
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || "http://localhost:4004";

// Cuántos mensajes por hilo se guardan en el equipo (igual que los que trae el servidor).
const LIMITE_CACHE = 50;

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
    throw errorHttp(res.status, err.error || "Error en la petición");
  }

  return res.json();
}

// 4xx: el servidor rechazó la petición y reintentar no sirve (ErrorPermanente).
// 5xx o gateway caído: error temporal; el módulo local lo reintenta.
function errorHttp(status: number, mensaje: string): Error {
  return esEstadoPermanente(status)
    ? new ErrorPermanente(mensaje)
    : new Error(mensaje);
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
 * 1. Muestra al instante la copia guardada en el equipo (módulo local), si existe.
 * 2. Carga los últimos 50 mensajes mediante HTTP y actualiza esa copia.
 * 3. Recibe los nuevos mensajes mediante eventos.
 *
 * Sin conexión, el hilo sigue mostrando la última copia guardada (como WhatsApp).
 */
export function escucharMensajes(
  ruta: string,
  alCambiar: (mensajes: Mensaje[]) => void,
  alError: (error: Error) => void,
  alConectar?: () => void
) {
  const hiloId = hiloIdDeRuta(ruta);
  const claveCache = `mensajes:${hiloId}`;

  let activo = true;
  let mensajesActuales: Mensaje[] = [];

  // Documentos tal como llegan del servidor (datos planos, se pueden guardar en IndexedDB).
  const crudos = new Map<string, any>();
  // Mensajes que solo vienen de la copia local; si el servidor ya no los tiene, se quitan.
  const soloDeCache = new Set<string>();
  let cargadoDelServidor = false;
  let temporizadorCache: ReturnType<typeof setTimeout> | null = null;

  // Guarda en el equipo los últimos 50 mensajes del hilo.
  const guardarCopiaLocal = () => {
    temporizadorCache = null;
    const lista = [...crudos.values()]
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
      .slice(-LIMITE_CACHE);
    void guardarCache(claveCache, lista);
  };

  // Agrupa varias escrituras seguidas (por ejemplo, al cargar el historial) en una sola.
  const programarCopiaLocal = () => {
    if (!cargadoDelServidor) return; // no se sobrescribe la copia con datos incompletos
    if (temporizadorCache) clearTimeout(temporizadorCache);
    temporizadorCache = setTimeout(guardarCopiaLocal, 300);
  };

  // Evita perder mensajes que lleguen mientras se carga el historial.
  const integrarMensaje = (mensajeRecibido: any, deCache = false) => {
    if (!activo) return;

    const mensaje = adaptarMensaje(mensajeRecibido);

    crudos.set(mensaje.id, mensajeRecibido);
    if (deCache) soloDeCache.add(mensaje.id);
    else soloDeCache.delete(mensaje.id);

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
    if (!deCache) programarCopiaLocal();
  };

  // Copia local: se muestra mientras responde el servidor, o en su lugar si no hay conexión.
  const cargarCopiaLocal = async () => {
    const copia = await leerCache<any[]>(claveCache);
    // Si el servidor respondió antes, sus datos son más recientes y no se tocan.
    if (!activo || cargadoDelServidor || !copia) return;
    copia.valor.forEach((m) => integrarMensaje(m, true));
  };

  // La carga inicial se hace aunque Socket.IO aún esté conectando. Al reconectar,
  // volvemos a sincronizar por si el navegador perdió eventos mientras estuvo fuera.
  const cargarMensajes = async () => {
    try {
      const filas: any[] = await pedir(
        `/hilos/${encodeURIComponent(hiloId)}/mensajes`
      );

      if (!activo) return;

      cargadoDelServidor = true;

      // Quita los mensajes de la copia local que el servidor ya no devuelve (por ejemplo, borrados).
      const idsServidor = new Set(filas.map((f) => String(f.id || f._id)));
      for (const id of soloDeCache) {
        if (!idsServidor.has(id)) {
          crudos.delete(id);
          mensajesActuales = mensajesActuales.filter((m) => m.id !== id);
        }
      }
      soloDeCache.clear();

      filas.forEach((f) => integrarMensaje(f));
      // Avisa aunque el hilo esté vacío, para que la interfaz sepa que la carga funcionó.
      alCambiar([...mensajesActuales]);
      programarCopiaLocal();
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

    // Hay conexión con el servidor: buen momento para vaciar la cola local.
    alConectar?.();
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

  // Muestra primero lo guardado en el equipo y carga el historial aunque el socket
  // todavía esté conectándose.
  void cargarCopiaLocal();
  cargarMensajes();

  // Limpieza cuando se cambia de hilo o se desmonta el componente.
  return () => {
    activo = false;

    // Si quedó una escritura de la copia local programada, se hace ya.
    if (temporizadorCache) {
      clearTimeout(temporizadorCache);
      guardarCopiaLocal();
    }

    socket.emit("salir-hilo", hiloId);

    socket.removeAllListeners();
    socket.disconnect();

    console.log("Socket.IO desconectado del hilo:", hiloId);
  };
}

// Sube el archivo al servicio de archivos por el gateway. El backend lo guarda
// en uploads local si Cloudinary no está configurado.
export async function subirArchivo(
  archivo: Blob,
  nombre: string
): Promise<ArchivoAdjunto> {
  const formData = new FormData();
  formData.append("archivo", archivo, nombre);

  const res = await fetch(`${API}/archivos`, {
    method: "POST",
    body: formData,
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw errorHttp(res.status, data.error || "No se pudo subir el archivo");
  }
  if (!data.url) {
    throw new Error("El servicio de archivos no devolvió la URL");
  }

  return data as ArchivoAdjunto;
}

// ---------- Envío con módulo local (funciona sin conexión) ----------

// Lo que se guarda en IndexedDB por cada mensaje sin enviar.
export interface DatosMensajePendiente {
  hiloId: string;
  texto: string;
  autorId: string;
  autorNombre: string;
  autorAvatar: string;
  autorAvatarColor: string;
  respondidoA: { autorNombre: string; texto: string } | null;
  // Se llena cuando el archivo ya subió, así un reintento no lo sube dos veces.
  archivoSubido: ArchivoAdjunto | null;
  // Adjuntos que ya tienen URL (por ejemplo, enlaces de Google Drive).
  archivosExtra?: ArchivoAdjunto[];
}

export type MensajePendiente = PendienteVisible<DatosMensajePendiente>;

// Cómo se envía un pendiente: primero el archivo (si hay) y luego el mensaje.
async function enviarPendiente(
  pendiente: Pendiente<DatosMensajePendiente>,
  { guardarDatos }: { guardarDatos: (d: DatosMensajePendiente) => Promise<void> }
) {
  let datos = pendiente.datos;

  if (pendiente.archivo && !datos.archivoSubido) {
    const subido = await subirArchivo(
      pendiente.archivo.blob,
      pendiente.archivo.nombre
    );
    datos = { ...datos, archivoSubido: subido };
    await guardarDatos(datos);
  }

  const { hiloId, archivoSubido, archivosExtra = [], ...mensaje } = datos;
  await pedir(`/hilos/${encodeURIComponent(hiloId)}/mensajes`, {
    method: "POST",
    body: JSON.stringify({
      ...mensaje,
      archivos: [...(archivoSubido ? [archivoSubido] : []), ...archivosExtra],
      // Mismo id en cada reintento: el servidor no duplica el mensaje.
      idCliente: pendiente.id,
    }),
  });
}

export const colaMensajes = crearColaOffline<DatosMensajePendiente>({
  enviar: enviarPendiente,
});

/**
 * Envía un mensaje. Primero queda guardado en el navegador (IndexedDB) y luego
 * se intenta enviar. Si no hay conexión, el mensaje se queda en la cola y se
 * envía solo cuando vuelva la conexión.
 */
export async function enviarMensaje(
  ruta: string,
  autor: Usuario,
  texto: string,
  archivo: File | null,
  mensajeCitado: Mensaje | null,
  archivosDrive: ArchivoAdjunto[] = []
) {
  const hiloId = hiloIdDeRuta(ruta);

  const pendiente = await colaMensajes.encolar({
    uid: autor.uid,
    grupo: hiloId,
    archivo,
    datos: {
      hiloId,
      texto,
      autorId: autor.uid,
      autorNombre: autor.nombre,
      autorAvatar: autor.avatar || "",
      autorAvatarColor: autor.avatarColor || "#5865f2",
      respondidoA: mensajeCitado
        ? {
            autorNombre: mensajeCitado.autorNombre,
            texto: mensajeCitado.texto,
          }
        : null,
      archivoSubido: null,
      // Enlaces de Google Drive: ya son URLs, no hay que subirlos
      archivosExtra: archivosDrive,
    },
  });

  // No se espera: la interfaz ya muestra el mensaje como pendiente.
  void colaMensajes.sincronizar(autor.uid);

  return pendiente;
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
