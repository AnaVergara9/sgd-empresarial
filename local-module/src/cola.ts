import * as almacen from "./almacen";
import { ErrorPermanente } from "./errores";
import type {
  EntradaCola,
  OpcionesCola,
  Pendiente,
  PendienteVisible,
} from "./tipos";

export interface ColaOffline<T> {
  // Guarda el envío en IndexedDB. Desde aquí ya no se pierde aunque se cierre el navegador.
  encolar: (entrada: EntradaCola<T>) => Promise<Pendiente<T>>;
  // Lista los pendientes de una cuenta, del más antiguo al más nuevo (opcionalmente de un grupo).
  listar: (uid: string, grupo?: string) => Promise<PendienteVisible<T>[]>;
  // Avisa cuando cambia la cola (en esta pestaña o en otra). Devuelve la función para dejar de escuchar.
  suscribir: (alCambiar: () => void) => () => void;
  // Intenta enviar todos los pendientes de la cuenta, en orden. Nunca lanza errores.
  sincronizar: (uid: string) => Promise<void>;
  // Pasa un envío con error a pendiente y lo vuelve a intentar.
  reintentar: (id: string) => Promise<void>;
  // Borra un envío de la cola sin enviarlo.
  descartar: (id: string) => Promise<void>;
  // Sincroniza ahora, al recuperar la red y cada cierto tiempo. Devuelve la función para detenerlo.
  iniciar: (uid: string) => () => void;
}

const CANAL_PESTANAS = "sgd-modulo-local";
const NOMBRE_BLOQUEO = "sgd-modulo-local-sincronizar";

// crypto.randomUUID solo existe en contextos seguros (https o localhost).
// Si se abre la app por IP en la red local, se genera un UUID v4 equivalente.
function nuevoId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

// Evita que dos pestañas abiertas envíen el mismo pendiente al mismo tiempo.
async function conBloqueo(tarea: () => Promise<void>): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.locks) {
    await navigator.locks.request(NOMBRE_BLOQUEO, tarea);
  } else {
    await tarea();
  }
}

export function crearColaOffline<T>(opciones: OpcionesCola<T>): ColaOffline<T> {
  const intervalo = opciones.intervaloReintentoMs ?? 15_000;

  const oyentes = new Set<() => void>();
  // Ids que se están enviando en esta pestaña. No se guarda en IndexedDB para que
  // un envío interrumpido (pestaña cerrada) vuelva a quedar como "pendiente".
  const enviando = new Set<string>();

  const canal =
    typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(CANAL_PESTANAS) : null;
  canal?.addEventListener("message", () => oyentes.forEach((f) => f()));

  const notificar = () => {
    oyentes.forEach((f) => f());
    canal?.postMessage("cambio");
  };

  // Una sola sincronización a la vez por pestaña. Si llega otra petición mientras
  // tanto, se repite al terminar para incluir lo que se encoló entre medio.
  let enCurso: Promise<void> | null = null;
  let repetir = false;

  // Marca de tiempo siempre creciente: dos envíos en el mismo milisegundo
  // no pueden empatar, así se conserva el orden en que se escribieron.
  let ultimoCreado = 0;
  const marcaCreacion = () => {
    ultimoCreado = Math.max(Date.now(), ultimoCreado + 1);
    return ultimoCreado;
  };

  async function procesar(uid: string): Promise<void> {
    const lista = (await almacen.listarPorUsuario<T>(uid))
      .filter((p) => p.estado === "pendiente")
      .sort((a, b) => a.creadoEn - b.creadoEn);

    for (const pendiente of lista) {
      enviando.add(pendiente.id);
      notificar();
      try {
        await opciones.enviar(pendiente, {
          guardarDatos: async (datos) => {
            pendiente.datos = datos;
            await almacen.guardar(pendiente);
          },
        });
        await almacen.eliminar(pendiente.id);
      } catch (error) {
        // Si lo descartaron mientras se enviaba, no se vuelve a guardar.
        const sigue = await almacen.obtener<T>(pendiente.id);
        if (!sigue) continue;

        const permanente = error instanceof ErrorPermanente;
        await almacen.guardar<T>({
          ...pendiente,
          estado: permanente ? "error" : "pendiente",
          intentos: pendiente.intentos + 1,
          ultimoError: error instanceof Error ? error.message : String(error),
        });
        // Sin conexión no tiene sentido seguir: los demás fallarían igual y
        // detenerse aquí conserva el orden de los mensajes.
        if (!permanente) break;
      } finally {
        enviando.delete(pendiente.id);
        notificar();
      }
    }
  }

  function sincronizar(uid: string): Promise<void> {
    if (enCurso) {
      repetir = true;
      return enCurso;
    }
    enCurso = (async () => {
      do {
        repetir = false;
        try {
          await conBloqueo(() => procesar(uid));
        } catch (error) {
          console.error("[local-module] Error al sincronizar la cola:", error);
        }
      } while (repetir);
    })().finally(() => {
      enCurso = null;
    });
    return enCurso;
  }

  return {
    async encolar({ uid, grupo, datos, archivo, nombreArchivo }) {
      const pendiente: Pendiente<T> = {
        id: nuevoId(),
        uid,
        grupo,
        datos,
        archivo: archivo
          ? {
              blob: archivo,
              nombre: nombreArchivo ?? (archivo instanceof File ? archivo.name : "archivo"),
              tipo: archivo.type || "application/octet-stream",
              tamano: archivo.size,
            }
          : null,
        estado: "pendiente",
        intentos: 0,
        ultimoError: null,
        creadoEn: marcaCreacion(),
      };
      await almacen.guardar(pendiente);
      notificar();
      return pendiente;
    },

    async listar(uid, grupo) {
      const lista = await almacen.listarPorUsuario<T>(uid);
      return lista
        .filter((p) => grupo === undefined || p.grupo === grupo)
        .sort((a, b) => a.creadoEn - b.creadoEn)
        .map((p) => ({ ...p, estado: enviando.has(p.id) ? "enviando" : p.estado }));
    },

    suscribir(alCambiar) {
      oyentes.add(alCambiar);
      return () => {
        oyentes.delete(alCambiar);
      };
    },

    sincronizar,

    async reintentar(id) {
      const pendiente = await almacen.obtener<T>(id);
      if (!pendiente) return;
      await almacen.guardar<T>({ ...pendiente, estado: "pendiente", ultimoError: null });
      notificar();
      await sincronizar(pendiente.uid);
    },

    async descartar(id) {
      await almacen.eliminar(id);
      notificar();
    },

    iniciar(uid) {
      const alRecuperarRed = () => void sincronizar(uid);
      window.addEventListener("online", alRecuperarRed);
      // navigator.onLine no es confiable (puede haber red local sin internet),
      // por eso también se reintenta cada cierto tiempo.
      const temporizador = window.setInterval(() => void sincronizar(uid), intervalo);
      void sincronizar(uid);

      return () => {
        window.removeEventListener("online", alRecuperarRed);
        window.clearInterval(temporizador);
      };
    },
  };
}
