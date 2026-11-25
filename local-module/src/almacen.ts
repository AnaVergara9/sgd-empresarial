import type { Pendiente } from "./tipos";

// Base de datos del navegador del módulo local. Sobrevive a recargas, al cierre
// del navegador y a la falta de conexión. Tiene dos almacenes:
// - "pendientes": envíos que esperan conexión (cola de salida).
// - "cache": última copia de datos leídos del servidor (mensajes, canales...).
const NOMBRE_BD = "sgd-modulo-local";
const VERSION_BD = 2; // v1: pendientes · v2: + cache
const PENDIENTES = "pendientes";
const CACHE = "cache";

export interface EntradaCache<T = unknown> {
  clave: string;
  valor: T;
  guardadoEn: number; // milisegundos
}

let conexion: Promise<IDBDatabase> | null = null;

function abrir(): Promise<IDBDatabase> {
  if (!conexion) {
    conexion = new Promise((resolve, reject) => {
      const peticion = indexedDB.open(NOMBRE_BD, VERSION_BD);

      // Crea lo que falte; así funciona tanto en navegadores nuevos como en los que ya tenían la v1.
      peticion.onupgradeneeded = () => {
        const bd = peticion.result;
        if (!bd.objectStoreNames.contains(PENDIENTES)) {
          const almacen = bd.createObjectStore(PENDIENTES, { keyPath: "id" });
          almacen.createIndex("uid", "uid");
        }
        if (!bd.objectStoreNames.contains(CACHE)) {
          bd.createObjectStore(CACHE, { keyPath: "clave" });
        }
      };

      peticion.onsuccess = () => {
        const bd = peticion.result;
        // Si otra pestaña actualiza la versión, se cierra esta conexión y se abrirá de nuevo.
        bd.onversionchange = () => {
          bd.close();
          conexion = null;
        };
        resolve(bd);
      };

      peticion.onerror = () => {
        conexion = null;
        reject(peticion.error);
      };
    });
  }
  return conexion;
}

async function transaccion<R>(
  almacen: string,
  modo: IDBTransactionMode,
  operacion: (almacen: IDBObjectStore) => IDBRequest<R>
): Promise<R> {
  const bd = await abrir();
  return new Promise((resolve, reject) => {
    const tx = bd.transaction(almacen, modo);
    const peticion = operacion(tx.objectStore(almacen));
    // Se resuelve al terminar la transacción, así el dato ya quedó escrito en disco.
    tx.oncomplete = () => resolve(peticion.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error("Transacción de IndexedDB cancelada"));
  });
}

// ---------- Pendientes ----------

export async function guardar<T>(pendiente: Pendiente<T>): Promise<void> {
  await transaccion(PENDIENTES, "readwrite", (a) => a.put(pendiente));
}

export function obtener<T>(id: string): Promise<Pendiente<T> | undefined> {
  return transaccion(PENDIENTES, "readonly", (a) => a.get(id));
}

export function listarPorUsuario<T>(uid: string): Promise<Pendiente<T>[]> {
  return transaccion(PENDIENTES, "readonly", (a) => a.index("uid").getAll(uid));
}

export async function eliminar(id: string): Promise<void> {
  await transaccion(PENDIENTES, "readwrite", (a) => a.delete(id));
}

// ---------- Caché de lectura ----------

export async function guardarEnCache<T>(clave: string, valor: T): Promise<void> {
  const entrada: EntradaCache<T> = { clave, valor, guardadoEn: Date.now() };
  await transaccion(CACHE, "readwrite", (a) => a.put(entrada));
}

export function leerDeCache<T>(clave: string): Promise<EntradaCache<T> | undefined> {
  return transaccion(CACHE, "readonly", (a) => a.get(clave));
}
