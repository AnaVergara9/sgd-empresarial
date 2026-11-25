// Módulo local: cola de envíos y caché de lectura guardadas en el navegador (IndexedDB).
// No depende del chat ni de React; quien lo usa decide cómo se envía cada elemento.
export { crearColaOffline } from "./cola";
export type { ColaOffline } from "./cola";
export { ErrorPermanente, esEstadoPermanente } from "./errores";
// Caché de lectura: última copia de mensajes, canales, subcanales e hilos para verlos sin conexión.
export { guardarCache, leerCache } from "./cache";
export type { EntradaCache } from "./cache";
export type {
  ArchivoLocal,
  AyudasEnvio,
  EntradaCola,
  EstadoPendiente,
  OpcionesCola,
  Pendiente,
  PendienteVisible,
} from "./tipos";
