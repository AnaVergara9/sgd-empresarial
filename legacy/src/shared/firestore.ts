"use client";

import { useEffect, useState } from "react";
import {
  collection,
  DocumentReference,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/shared/firebase";

/**
 * Escucha en tiempo real una colección ordenada por "creadoEn".
 * Si falla (permisos, red), deja de mostrar "Cargando..." y expone el error
 * en lugar de quedarse cargando para siempre.
 * Si `ruta` es null no se suscribe (por ejemplo, mientras faltan parámetros de la URL).
 */
export function useColeccion<T extends { id: string }>(ruta: string[] | null) {
  const [datos, setDatos] = useState<T[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // La ruta se une en un string para que el efecto no se repita en cada render
  const clave = ruta ? ruta.join("/") : null;

  useEffect(() => {
    if (!clave) return;
    setDatos([]);
    setCargando(true);
    setError(null);

    const consulta = query(collection(db, clave), orderBy("creadoEn", "asc"));
    const cancelarSuscripcion = onSnapshot(
      consulta,
      (resultado) => {
        setDatos(resultado.docs.map((documento) => ({ id: documento.id, ...documento.data() } as T)));
        setCargando(false);
      },
      (err) => {
        console.error(`Error escuchando ${clave}:`, err);
        setError(err);
        setCargando(false);
      }
    );
    return () => cancelarSuscripcion();
  }, [clave]);

  return { datos, cargando, error };
}

// Firestore permite máximo 500 operaciones por lote
const MAXIMO_POR_LOTE = 500;

/**
 * Borra un documento y todas sus subcolecciones indicadas, usando lotes (writeBatch)
 * en lugar de una petición por documento.
 *
 * `subcolecciones` describe la jerarquía, por ejemplo para un canal:
 * ["subcanales", "hilos", "mensajes"]
 */
export async function eliminarEnCascada(ref: DocumentReference, subcolecciones: string[]) {
  const referencias: DocumentReference[] = [];

  // Recolectamos primero todos los documentos descendientes, nivel por nivel
  let nivelActual: DocumentReference[] = [ref];
  for (const nombre of subcolecciones) {
    const resultados = await Promise.all(nivelActual.map((padre) => getDocs(collection(padre, nombre))));
    nivelActual = resultados.flatMap((resultado) => resultado.docs.map((documento) => documento.ref));
    referencias.push(...nivelActual);
  }

  // Borramos de los hijos hacia el padre para no dejar huérfanos si algo falla a mitad
  referencias.reverse().push(ref);

  for (let i = 0; i < referencias.length; i += MAXIMO_POR_LOTE) {
    const lote = writeBatch(db);
    referencias.slice(i, i + MAXIMO_POR_LOTE).forEach((r) => lote.delete(r));
    await lote.commit();
  }
}
