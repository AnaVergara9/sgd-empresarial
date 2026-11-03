import { db } from "@/shared/firebase";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  FieldPath,
  limitToLast,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { ArchivoAdjunto, Mensaje, Usuario } from "@/types";

const LIMITE_MENSAJES = 50;

/**
 * Escucha los últimos 50 mensajes de un hilo en orden cronológico.
 * Reutiliza los objetos de los mensajes que no cambiaron para que React.memo
 * evite volver a dibujar toda la lista con cada mensaje nuevo.
 */
export function escucharMensajes(
  ruta: string,
  alCambiar: (mensajes: Mensaje[]) => void,
  alError: (error: Error) => void
) {
  let anteriores = new Map<string, Mensaje>();
  const q = query(collection(db, ruta), orderBy("fecha", "asc"), limitToLast(LIMITE_MENSAJES));

  return onSnapshot(
    q,
    (snap) => {
      const cambiados = new Set(snap.docChanges().map((cambio) => cambio.doc.id));
      const siguientes = new Map<string, Mensaje>();

      const mensajes = snap.docs.map((documento) => {
        const previo = cambiados.has(documento.id) ? undefined : anteriores.get(documento.id);
        const mensaje = previo ?? ({ id: documento.id, ...documento.data() } as Mensaje);
        siguientes.set(documento.id, mensaje);
        return mensaje;
      });

      anteriores = siguientes;
      alCambiar(mensajes);
    },
    alError
  );
}

// Sube un archivo a Cloudinary. Lanza un error si la subida falla.
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

  await addDoc(collection(db, ruta), {
    texto,
    autorId: autor.uid,
    autorNombre: autor.nombre,
    autorAvatar: autor.avatar || "",
    autorAvatarColor: autor.avatarColor || "#5865f2",
    fecha: serverTimestamp(),
    archivos: archivoSubido ? [archivoSubido] : [],
    reacciones: {},
    respondidoA: mensajeCitado
      ? { autorNombre: mensajeCitado.autorNombre, texto: mensajeCitado.texto }
      : null,
  });
}

/**
 * Agrega o quita la reacción del usuario de forma atómica
 * (si dos personas reaccionan a la vez, no se pisan entre sí).
 */
export async function alternarReaccion(ruta: string, mensajeId: string, emoji: string, uid: string, yaReacciono: boolean) {
  await updateDoc(
    doc(db, ruta, mensajeId),
    new FieldPath("reacciones", emoji),
    yaReacciono ? arrayRemove(uid) : arrayUnion(uid)
  );
}
