"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, orderBy, query, doc, getDocs, deleteDoc } from "firebase/firestore";
import { Canal, Subcanal } from "@/types";
import { useRouter } from "next/navigation";

interface PropiedadesColumnaSubcanales {
  canalId: string;
  nombreCanal?: string;
  subcanalId: string;
  alSeleccionarSubcanal: (subcanal: Subcanal) => void;
  esAdministrador: boolean;
  alCrearSubcanal?: (nombre: string) => void;
  empresaId: string;
}

export default function ColumnaSubcanales({ canalId, nombreCanal, subcanalId, alSeleccionarSubcanal, esAdministrador, alCrearSubcanal, empresaId }: PropiedadesColumnaSubcanales) {
  const [subcanales, setSubcanales] = useState<Subcanal[]>([]);
  const [cargando, setCargando] = useState(true);
  const router = useRouter();

  useEffect(() => {

    if (!empresaId || !canalId) return;
    
    const consulta = query(
      collection(db, "empresas", empresaId, "canales", canalId, "subcanales"),
      orderBy("creadoEn", "asc")
    );

    const cancelarSuscripcion = onSnapshot(consulta, (resultado) => {
      setSubcanales(resultado.docs.map(documento => ({ id: documento.id, ...documento.data() } as Subcanal)));
      setCargando(false);
    });
    return () => cancelarSuscripcion();
  }, [canalId, empresaId]);

  const handleEliminarSubcanal = async (e: React.MouseEvent, subcanal: Subcanal) => {
    e.stopPropagation(); // Evita que se seleccione el subcanal al hacer clic en la papelera

    if (!confirm(`¿Estás seguro de que deseas eliminar el subcanal "${subcanal.nombre}"? Se borrarán todos sus hilos y mensajes.`)) {
      return;
    }

    try {
      // 1. Referencia al documento del subcanal
      const subcanalRef = doc(db, "empresas", empresaId, "canales", canalId, "subcanales", subcanal.id);

      // 2. Traer y borrar todos los hilos que pertenezcan a este subcanal
      const hilosRef = collection(subcanalRef, "hilos");
      const hilosSnapshot = await getDocs(hilosRef);

      const promesasHilos = hilosSnapshot.docs.map(async (hiloDoc) => {
        // Por cada hilo, primero borramos sus mensajes internos
        const mensajesRef = collection(hiloDoc.ref, "mensajes");
        const mensajesSnapshot = await getDocs(mensajesRef);
        const promesasMensajes = mensajesSnapshot.docs.map(msgDoc => deleteDoc(msgDoc.ref));
        await Promise.all(promesasMensajes);

        // Luego borramos el hilo en sí
        return deleteDoc(hiloDoc.ref);
      });

      // Esperamos a que se limpien todos los sub-hilos y mensajes
      await Promise.all(promesasHilos);

      // 3. Finalmente, borramos el documento del subcanal
      await deleteDoc(subcanalRef);

      // 4. Si el subcanal eliminado era el activo, redirigimos al área general del canal
      if (subcanalId === subcanal.id) {
        router.push(`/dashboard/${empresaId}/${canalId}`);
      }

    } catch (error) {
      console.error("Error al eliminar el subcanal en cascada:", error);
      alert("No se pudo eliminar el subcanal debido a un problema de permisos.");
    }
  };

  return (
    <div className="w-52 flex-shrink-0 bg-[#2b2d31] flex flex-col border-r border-white/10 h-full">
      <div className="h-14 p-4 border-b border-white/10 flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold text-sm">SUBCANALES</h2>
        </div>
        {esAdministrador && (
          <button
            onClick={() => {
              const nombre = prompt("Ingresa el nombre:"); // Se pide el nombre al usuario
              if (nombre && alCrearSubcanal) {
                alCrearSubcanal(nombre); // Solo crea el subcanal si se ingresó un nombre
              }
            }}
            className="text-gray-400 hover:text-white text-xl leading-none transition-colors"
            title="Crear subcanal"
          >
          +
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {cargando && <p className="text-gray-400 text-xs px-2 mt-2">Cargando subcanales...</p>}

        {!cargando && subcanales.length === 0 && (
          <p className="text-gray-400 text-xs px-2 mt-2">
            {esAdministrador ? "No hay subcanales. Crea el primero con +" : "No hay subcanales disponibles."}
          </p>
        )}

        {subcanales.map((subcanal) => (
          <button
            key={subcanal.id}
            onClick={() => alSeleccionarSubcanal(subcanal)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${
              subcanalId === subcanal.id
                ? "bg-[#5865f2] text-white"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <div className="flex items-center gap-2 overflow-hidden truncate">
              <span className="text-gray-500 flex-shrink-0">≡</span>
              <span className="truncate">{subcanal.nombre}</span>
            </div>

            {/* 🌟 BOTÓN DE ELIMINAR (Solo visible para admins y con efecto hover del grupo) */}
            {esAdministrador && (
              <button
                onClick={(e) => handleEliminarSubcanal(e, subcanal)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-rose-500 transition-all p-1 text-xs"
                title="Eliminar Subcanal"
              >
                🗑️
              </button>
            )}
            
            <span className="text-gray-500">≡</span>
            {subcanal.nombre}
          </button>
        ))}
      </div>
    </div>
  );
}