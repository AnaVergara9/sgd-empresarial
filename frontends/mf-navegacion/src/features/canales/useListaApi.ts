import { useCallback, useEffect, useRef, useState } from "react";
import { guardarCache, leerCache } from "@local-module";
import { listarCanales, listarSubcanales, listarHilos } from "./canales.api";

const INTERVALO_MS = 4000; // temporal, hasta tener tiempo real con Socket.io

const adaptar = <T,>(filas: any[]) => filas.map((f) => ({ ...f, creadoEn: f.creado_en })) as T[];

// Lee canales, subcanales o hilos desde el backend nuevo y los refresca cada pocos segundos.
// Con el módulo local guarda la última lista en el equipo: sin conexión se sigue viendo.
export function useListaApi<T>(ruta: string[] | null) {
  const [datos, setDatos] = useState<T[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const ultimaFirma = useRef("");

  const clave = ruta ? ruta.join("/") : null;
  const claveActual = useRef(clave);
  claveActual.current = clave;

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

      if (claveActual.current !== clave) return; // el usuario ya cambió de selección

      // Solo se actualiza la pantalla (y la copia local) si algo cambió
      const firma = JSON.stringify(filas);
      if (firma !== ultimaFirma.current) {
        ultimaFirma.current = firma;
        setDatos(adaptar<T>(filas));
        void guardarCache(`lista:${clave}`, filas);
      }
      setError(null);
    } catch (e: any) {
      if (claveActual.current !== clave) return;
      setError(e instanceof Error ? e : new Error(e?.message || "Error al cargar"));
    } finally {
      if (claveActual.current === clave) setCargando(false);
    }
  }, [clave]);

  useEffect(() => {
    ultimaFirma.current = "";
    setCargando(true);

    // Muestra al instante la copia local; el servidor la reemplaza cuando responda.
    if (clave) {
      leerCache<any[]>(`lista:${clave}`).then((copia) => {
        if (!copia || claveActual.current !== clave || ultimaFirma.current !== "") return;
        setDatos(adaptar<T>(copia.valor));
        setCargando(false);
      });
    }

    recargar();

    const temporizador = setInterval(() => {
      if (!document.hidden) recargar(); // no pide nada si la pestaña está en segundo plano
    }, INTERVALO_MS);

    return () => clearInterval(temporizador);
  }, [recargar, clave]);

  return { datos, cargando, error, recargar };
}
