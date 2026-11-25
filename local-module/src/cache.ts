import { guardarEnCache, leerDeCache, type EntradaCache } from "./almacen";

/**
 * Caché de lectura: guarda la última respuesta buena del servidor para poder
 * mostrarla cuando no hay conexión (como WhatsApp con los chats ya abiertos).
 *
 * El valor debe ser un dato "plano" (objetos, arreglos, texto, números, fechas):
 * IndexedDB no puede guardar funciones.
 *
 * Nunca lanzan errores: si el navegador no deja usar IndexedDB (por ejemplo, en
 * modo privado), la app sigue funcionando, solo que sin copia local.
 */
export async function guardarCache<T>(clave: string, valor: T): Promise<void> {
  try {
    await guardarEnCache(clave, valor);
  } catch (error) {
    console.warn("[local-module] No se pudo guardar en caché:", clave, error);
  }
}

export async function leerCache<T>(clave: string): Promise<EntradaCache<T> | undefined> {
  try {
    return await leerDeCache<T>(clave);
  } catch (error) {
    console.warn("[local-module] No se pudo leer la caché:", clave, error);
    return undefined;
  }
}

export type { EntradaCache };
