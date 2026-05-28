"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, orderBy, query, doc,  deleteDoc, getDocs, QueryDocumentSnapshot } from "firebase/firestore";
import { Canal, Subcanal, Hilo } from "@/types";
import { useRouter } from "next/navigation";

interface PropiedadesColumnaHilos {
  canalId: string;
  subcanalId: string;
  hiloId?: string | null;
  alSeleccionarHilo: (hilo: Hilo) => void;
  esAdministrador: boolean;
  alCrearHilo: (nombre: string) => void;
  hiloActivo?: Hilo | null;
  empresaId: string;
}

export default function ColumnaHilos({ canalId, subcanalId, hiloId, alSeleccionarHilo, esAdministrador, alCrearHilo, hiloActivo, empresaId }: PropiedadesColumnaHilos) {
  const [hilos, setHilos] = useState<Hilo[]>([]);
  const [cargando, setCargando] = useState(true);
  const router = useRouter();

  useEffect(() => {

    if (!empresaId || !canalId || !subcanalId) return;

    // Ruta anidada exacta: empresas -> id -> canales -> id -> subcanales -> id -> hilos
    const consulta = query(
    collection(db, "empresas", empresaId, "canales", canalId, "subcanales", subcanalId, "hilos"),
    orderBy("creadoEn", "asc")
  );

    const cancelarSuscripcion = onSnapshot(consulta, (resultado) => {
      setHilos(resultado.docs.map(documento => ({ id: documento.id, ...documento.data() } as Hilo)));
      setCargando(false);
    });
    return () => cancelarSuscripcion();
  }, [empresaId, canalId, subcanalId]);

  return (
    <div className="w-52 flex-shrink-0 bg-[#2b2d31] flex flex-col border-r border-white/10 h-full">
      <div className="h-14 p-4 border-b border-white/10 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-white font-semibold text-sm">HILOS</h2>
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
          <div 
            key={hilo.id} 
            className="group/hilo flex items-center justify-between w-full rounded-md transition-colors hover:bg-white/5"
          >
            <button
              onClick={() => alSeleccionarHilo(hilo)}
              className={`flex-1 text-left px-3 py-2 text-sm flex items-center gap-2 ${
                hiloId === hilo.id || (hiloActivo && hiloActivo.id === hilo.id)
                  ? "bg-[#5865f2] text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <span className="text-gray-500">💬</span>
              <span>{hilo.nombre}</span>
            </button>

            {esAdministrador && (
              <button
                onClick={async (e) => {
                  e.stopPropagation(); // Evita que se abra el hilo al dar clic en la papelera
                  if (confirm(`¿Estás seguro de que deseas eliminar el hilo "${hilo.nombre}"?`)) {
                    try {
                      const hiloRef = doc(db, "empresas", empresaId, "canales", canalId, "subcanales", subcanalId, "hilos", hilo.id);

                      const mensajesRef = collection(hiloRef, "mensajes");
                      const mensajesSnapshot = await getDocs(mensajesRef);
                      const promesasBorrado = mensajesSnapshot.docs.map((docMensaje: QueryDocumentSnapshot) => deleteDoc(docMensaje.ref));
                      await Promise.all(promesasBorrado);

                      await deleteDoc(hiloRef);
                      // Si el hilo que eliminamos es el que actualmente está seleccionado en la URL, redirigimos
                      if (hiloId === hilo.id || (hiloActivo && hiloActivo.id === hilo.id)) {
                        router.push(`/dashboard/${empresaId}/${canalId}/${subcanalId}`);
                      }
                    } catch (error) {
                      console.error("Error al eliminar hilo y sus mensajes:", error);
                    }
                  }
                }}
                className="opacity-0 group-hover/hilo:opacity-100 p-2 text-gray-400 hover:text-rose-500 transition-all text-xs mr-1"
                title="Eliminar Hilo"
              >
                🗑️
              </button>
            )}
          </div>
        ))}
    </div>
  </div>
  );
}