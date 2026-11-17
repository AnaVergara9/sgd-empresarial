"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { listarCanales, listarSubcanales, listarHilos } from "./canales.api";

const INTERVALO_MS = 4000; // temporal, hasta tener tiempo real con Socket.io

// Lee canales, subcanales o hilos desde el backend nuevo y los refresca cada pocos segundos.
export function useListaApi<T>(ruta: string[] | null) {
  const [datos, setDatos] = useState<T[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const ultimaFirma = useRef("");

  const clave = ruta ? ruta.join("/") : null;

  const recargar = useCallback(async () => {
    if (!clave) {
      ultimaFirma.current = "";
      setDatos([]);
      setCargando(false);
      return;
    }
    const partes = clave.split("/");
    const tipo = partes[partes.length - 1];
    const padreId = partes[partes.length - 2];

    try {
      let filas: any[] = [];
      if (tipo === "canales") filas = await listarCanales(padreId);
      else if (tipo === "subcanales") filas = await listarSubcanales(padreId);
      else if (tipo === "hilos") filas = await listarHilos(padreId);

      // Solo se actualiza la pantalla si algo cambió
      const firma = JSON.stringify(filas);
      if (firma !== ultimaFirma.current) {
        ultimaFirma.current = firma;
        setDatos(filas.map((f) => ({ ...f, creadoEn: f.creado_en })) as T[]);
      }
      setError(null);
    } catch (e: any) {
      setError(e instanceof Error ? e : new Error(e?.message || "Error al cargar"));
    } finally {
      setCargando(false);
    }
  }, [clave]);

  useEffect(() => {
    ultimaFirma.current = "";
    setCargando(true);
    recargar();

    const temporizador = setInterval(() => {
      if (!document.hidden) recargar(); // no pide nada si la pestaña está en segundo plano
    }, INTERVALO_MS);

    return () => clearInterval(temporizador);
  }, [recargar]);

  return { datos, cargando, error, recargar };
}