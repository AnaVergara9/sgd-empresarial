// Estado guardado en IndexedDB.
// - "pendiente": espera conexión; se reintenta solo.
// - "error": el servidor lo rechazó (por ejemplo, archivo demasiado grande). Se reintenta o se descarta a mano.
export type EstadoGuardado = "pendiente" | "error";

// Estado que ve la interfaz: añade "enviando", que solo existe en memoria mientras dura el envío.
export type EstadoPendiente = EstadoGuardado | "enviando";

// Archivo adjunto guardado en el navegador. IndexedDB permite guardar Blobs.
export interface ArchivoLocal {
  blob: Blob;
  nombre: string;
  tipo: string;
  tamano: number; // bytes
}

export interface Pendiente<T> {
  // UUID generado en el navegador. El servidor lo usa como idCliente para no duplicar el envío.
  id: string;
  // Cuenta dueña del envío: cada cuenta solo ve y sincroniza lo suyo.
  uid: string;
  // Agrupación libre; el chat usa el id del hilo.
  grupo: string;
  datos: T;
  archivo: ArchivoLocal | null;
  estado: EstadoGuardado;
  intentos: number;
  ultimoError: string | null;
  creadoEn: number; // milisegundos
}

export interface PendienteVisible<T> extends Omit<Pendiente<T>, "estado"> {
  estado: EstadoPendiente;
}

export interface AyudasEnvio<T> {
  // Guarda un avance parcial, por ejemplo la URL del archivo ya subido,
  // para que un reintento no lo vuelva a subir.
  guardarDatos: (datos: T) => Promise<void>;
}

export interface OpcionesCola<T> {
  // Envía un elemento al servidor. Debe lanzar ErrorPermanente si el servidor
  // lo rechaza; cualquier otro error se considera falta de conexión y se reintenta.
  enviar: (pendiente: Pendiente<T>, ayudas: AyudasEnvio<T>) => Promise<void>;
  // Cada cuánto se reintenta mientras haya pendientes (por defecto 15 s).
  intervaloReintentoMs?: number;
}

export interface EntradaCola<T> {
  uid: string;
  grupo: string;
  datos: T;
  archivo?: File | Blob | null;
  nombreArchivo?: string;
}
