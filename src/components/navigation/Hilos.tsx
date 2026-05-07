"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { Canal, Subcanal, Hilo } from "@/types";

interface PropiedadesColumnaHilos {
  canalId: string;
  subcanalId: string;
  hiloId: string | null;
  alSeleccionarHilo: (hilo: Hilo) => void;
  esAdministrador: boolean;
  alCrearHilo: (nombre: string) => void;
}

export default function ColumnaHilos({ canalId, subcanalId, hiloId, alSeleccionarHilo, esAdministrador, alCrearHilo }: PropiedadesColumnaHilos) {
  const [hilos, setHilos] = useState<Hilo[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const consulta = query(
      collection(db, `canales/${canalId}/subcanales/${subcanalId}/hilos`),
      orderBy("creadoEn", "asc")
    );
    const cancelarSuscripcion = onSnapshot(consulta, (resultado) => {
      setHilos(resultado.docs.map(documento => ({ id: documento.id, ...documento.data() } as Hilo)));
      setCargando(false);
    });
    return () => cancelarSuscripcion();
  }, [canalId, subcanalId]);

  return (
    <div className="w-60 flex-shrink-0 bg-[#2b2d31] flex flex-col border-r border-white/10 h-full">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wide">{subcanalId}</p>
          <h2 className="text-white font-semibold text-sm">Hilos</h2>
        </div>
        {esAdministrador && (
          <button
            onClick={() => {
              const nombre = prompt("Ingresa el nombre:"); // Se pide el nombre al usuario
              if (nombre) {
                alCrearHilo(nombre); // Solo crea el hilo si se ingresó un nombre
              }
            }}
            className="text-gray-400 hover:text-white text-xl leading-none transition-colors"
            title="Crear hilo"
          >
          +
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {cargando && <p className="text-gray-400 text-xs px-2 mt-2">Cargando hilos...</p>}

        {!cargando && hilos.length === 0 && (
          <p className="text-gray-400 text-xs px-2 mt-2">
            {esAdministrador ? "No hay hilos. Crea el primero con +" : "No hay hilos disponibles."}
          </p>
        )}

        {hilos.map((hilo) => (
          <button
            key={hilo.id}
            onClick={() => alSeleccionarHilo(hilo)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${
              hiloId === hilo.id
                ? "bg-[#5865f2] text-white"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <span className="text-gray-500">💬</span>
            {hilo.nombre}
          </button>
        ))}
      </div>
    </div>
  );
}