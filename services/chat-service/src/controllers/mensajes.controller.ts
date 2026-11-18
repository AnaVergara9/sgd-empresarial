import { Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';
import { Mensaje } from '../models/mensaje.model';
import { emitirEventoHilo } from '../socket';

function esUuid(valor: unknown): valor is string {
  return (
    typeof valor === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(valor)
  );
}

const LIMITE_MENSAJES = 50;

// Devuelve los últimos 50 mensajes de un hilo, del más viejo al más nuevo.
export async function listarMensajes(req: Request, res: Response) {
  const { hiloId } = req.params;

  if (!esUuid(hiloId)) {
    return res.status(400).json({ error: "hiloId no válido" });
  }

  try {
    const mensajes = await Mensaje.find({ hiloId })
      .sort({ fecha: -1 })
      .limit(LIMITE_MENSAJES)
      .lean();
    res.json(mensajes.reverse());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cargar los mensajes' });
  }
}

// Guarda un mensaje nuevo en un hilo.
export async function enviarMensaje(req: Request, res: Response) {
  const { texto, autorId, autorNombre, autorAvatar, autorAvatarColor, archivos, respondidoA } = req.body;
  const { hiloId } = req.params;

  if (!esUuid(hiloId)) {
    return res.status(400).json({ error: "hiloId no válido" });
  }

  if (!autorId || !autorNombre) {
    return res.status(400).json({ error: 'Faltan autorId o autorNombre' });
  }

  const hayArchivos = Array.isArray(archivos) && archivos.length > 0;
  if (!String(texto || '').trim() && !hayArchivos) {
    return res.status(400).json({ error: 'El mensaje no puede estar vacío' });
  }

  try {
    const mensaje = await Mensaje.create({
      hiloId,
      texto: String(texto || ''),
      autorId,
      autorNombre,
      autorAvatar,
      autorAvatarColor,
      archivos: hayArchivos ? archivos : [],
      respondidoA: respondidoA || null,
    });

    // Notificamos a los usuarios conectados al hilo.
    emitirEventoHilo(hiloId, 'nuevo-mensaje', mensaje.toObject());

    // Respondemos al usuario que envió el mensaje.
    res.status(201).json(mensaje);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al enviar el mensaje' });
  }
}

// Agrega o quita la reacción de un usuario (si ya reaccionó, la quita).
export async function alternarReaccion(req: Request, res: Response) {
  const { emoji, uid } = req.body;
  const id = req.params.id;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ error: "Identificador no válido" });
  }

  if (!emoji || !uid || String(emoji).length > 8 || /[.$]/.test(String(emoji))) {
    return res.status(400).json({ error: 'Faltan el emoji o el uid, o el emoji no es válido' });
  }

  try {
    const campo = `reacciones.${emoji}`;
    const mensaje = await Mensaje.findById(id).lean();
    if (!mensaje) {
      return res.status(404).json({ error: 'Mensaje no encontrado' });
    }

    const yaReacciono = ((mensaje.reacciones as Record<string, string[]>)?.[emoji] || []).includes(uid);
    // $pull quita el uid de la lista; $addToSet lo agrega sin repetirlo
    const cambio = yaReacciono ? { $pull: { [campo]: uid } } : { $addToSet: { [campo]: uid } };
    const actualizado = await Mensaje.findByIdAndUpdate(id, cambio, { new: true }).lean();

    // Notificamos que el mensaje fue actualizado.
    emitirEventoHilo(String(actualizado?.hiloId), 'mensaje-actualizado', actualizado);

    res.json(actualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al reaccionar' });
  }
}

// Borra todos los mensajes de un hilo (para cuando el hilo se elimine en canales-service).
export async function eliminarMensajesDeHilo(req: Request, res: Response) {
  const { hiloId } = req.params;

  if (!esUuid(hiloId)) {
    return res.status(400).json({ error: "hiloId no válido" });
  }

  try {
    const r = await Mensaje.deleteMany({ hiloId });
    res.json({ eliminados: r.deletedCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar los mensajes' });
  }
}
