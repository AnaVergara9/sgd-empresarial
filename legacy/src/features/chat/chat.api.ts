import { ArchivoAdjunto, Mensaje, Usuario } from "@/types";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const INTERVALO_MS = 3000; // cada cuánto se piden mensajes nuevos (temporal, hasta tener Socket.io)
const EVENTO_REFRESCAR = "chat:refrescar";

async function pedir<T = any>(url: string, opciones?: RequestInit): Promise<T> {
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

// La ruta tiene la forma .../hilos/{hiloId}/mensajes, el id del hilo es el penúltimo elemento
const hiloIdDeRuta = (ruta: string) => {
  const partes = ruta.split("/");
  return partes[partes.length - 2];
};

// Mongo devuelve _id y la fecha como texto. Se adapta a lo que esperan los componentes.
function adaptarMensaje(m: any): Mensaje {
  const fecha = new Date(m.fecha);
  return {
    ...m,
    id: m._id,
    fecha: {
      toDate: () => fecha,
      toMillis: () => fecha.getTime(),
      seconds: Math.floor(fecha.getTime() / 1000),
      nanoseconds: 0,
    },
  } as unknown as Mensaje;
}

/**
 * Pide los últimos 50 mensajes del hilo cada pocos segundos (polling).
 * Solo avisa a la pantalla si algo cambió, y reutiliza los mensajes que no cambiaron.
 * Devuelve una función para dejar de escuchar, igual que onSnapshot.
 */
export function escucharMensajes(
  ruta: string,
  alCambiar: (mensajes: Mensaje[]) => void,
  alError: (error: Error) => void
) {
  const hiloId = hiloIdDeRuta(ruta);
  let anteriores = new Map<string, { firma: string; mensaje: Mensaje }>();
  let activo = true;
  let primeraVez = true;

  const cargar = async () => {
    try {
      const filas: any[] = await pedir(`/hilos/${encodeURIComponent(hiloId)}/mensajes`);
      if (!activo) return;

      const siguientes = new Map<string, { firma: string; mensaje: Mensaje }>();
      let hayCambios = primeraVez || filas.length !== anteriores.size;

      const mensajes = filas.map((fila) => {
        const firma = JSON.stringify(fila);
        const previo = anteriores.get(fila._id);
        if (previo && previo.firma === firma) {
          siguientes.set(fila._id, previo);
          return previo.mensaje;
        }
        hayCambios = true;
        const mensaje = adaptarMensaje(fila);
        siguientes.set(fila._id, { firma, mensaje });
        return mensaje;
      });

      anteriores = siguientes;
      if (hayCambios) alCambiar(mensajes);
      primeraVez = false;
    } catch (e: any) {
      if (activo) alError(e instanceof Error ? e : new Error(e?.message || "Error al cargar mensajes"));
    }
  };

  cargar();
  const temporizador = setInterval(cargar, INTERVALO_MS);
  window.addEventListener(EVENTO_REFRESCAR, cargar);

  return () => {
    activo = false;
    clearInterval(temporizador);
    window.removeEventListener(EVENTO_REFRESCAR, cargar);
  };
}

// Sube un archivo a Cloudinary. Lanza un error si la subida falla.
// (Se deja igual: todavía no pasa por archivos-service.)
export async function subirArchivo(archivo: File): Promise<ArchivoAdjunto> {
  const formData = new FormData();
  formData.append("file", archivo);
  formData.append("upload_preset", "chat_upload");

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`,
    { method: "POST", body: formData }
  );
  const data = await res.json();
  if (!res.ok || !data.secure_url) {
    throw new Error(data?.error?.message || "No se pudo subir el archivo");
  }

  return { url: data.secure_url, nombre: archivo.name, tipo: archivo.type };
}

export async function enviarMensaje(
  ruta: string,
  autor: Usuario,
  texto: string,
  archivo: File | null,
  mensajeCitado: Mensaje | null
) {
  // Si hay archivo, se sube primero; si falla, el mensaje no se envía
  const archivoSubido = archivo ? await subirArchivo(archivo) : null;

  await pedir(`/hilos/${encodeURIComponent(hiloIdDeRuta(ruta))}/mensajes`, {
    method: "POST",
    body: JSON.stringify({
      texto,
      autorId: autor.uid,
      autorNombre: autor.nombre,
      autorAvatar: autor.avatar || "",
      autorAvatarColor: autor.avatarColor || "#5865f2",
      archivos: archivoSubido ? [archivoSubido] : [],
      respondidoA: mensajeCitado
        ? { autorNombre: mensajeCitado.autorNombre, texto: mensajeCitado.texto }
        : null,
    }),
  });

  window.dispatchEvent(new Event(EVENTO_REFRESCAR)); // que se vea al instante
}

/**
 * Agrega o quita la reacción del usuario. El backend decide si la agrega o la quita,
 * por eso ya no se usa yaReacciono (se deja el parámetro para no romper los componentes).
 */
export async function alternarReaccion(
  _ruta: string,
  mensajeId: string,
  emoji: string,
  uid: string,
  _yaReacciono: boolean
) {
  await pedir(`/mensajes/${encodeURIComponent(mensajeId)}/reacciones`, {
    method: "POST",
    body: JSON.stringify({ emoji, uid }),
  });

  window.dispatchEvent(new Event(EVENTO_REFRESCAR));
}