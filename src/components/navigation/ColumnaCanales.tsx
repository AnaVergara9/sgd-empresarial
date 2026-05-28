"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, orderBy, query, doc, getDocs, deleteDoc } from "firebase/firestore";
import { Canal } from "@/types";
import { useRouter } from "next/navigation";


interface PropiedadesColumnaCanales {
  canalId: string;
  alSeleccionarCanal: (canal: Canal) => void;
  esAdministrador: boolean;
  alCrearCanal: (nombre: string) => Promise<any>;
  empresaId: string;
}

export default function ColumnaCanales({ canalId, alSeleccionarCanal, esAdministrador, alCrearCanal, empresaId }: PropiedadesColumnaCanales) {
  const [canales, setCanales] = useState<Canal[]>([]);
  const [cargando, setCargando] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const ruta = collection(db, "empresas", empresaId, "canales"); //ruta específica para los canales de la empresa
    const consulta = query(ruta, orderBy("creadoEn", "asc"));

    const cancelarSuscripcion = onSnapshot(consulta, (resultado) => {
      setCanales(resultado.docs.map(documento => ({ id: documento.id, ...documento.data() } as Canal)));
      setCargando(false);
    });
    return () => cancelarSuscripcion();
  }, [empresaId]);

  const handleEliminarCanal = async (e: React.MouseEvent, canal: any) => {
  e.stopPropagation(); // 🌟 Crucial para que no se seleccione el canal al dar clic en la papelera

  const confirmacion = confirm(
    `¿¡CUIDADO!? ¿Estás segura de que deseas eliminar el canal "${canal.nombre}"?\nEsto borrará permanentemente todos sus subcanales, hilos y mensajes.`
  );
  
  if (!confirmacion) return;

  try {
    // 1. Referencia al documento del Canal principal
    const canalRef = doc(db, "empresas", empresaId, "canales", canal.id);

    // 2. Traer todos los subcanales que pertenecen a este canal
    const subcanalesRef = collection(canalRef, "subcanales");
    const subcanalesSnapshot = await getDocs(subcanalesRef);

    // 3. Recorrer y borrar cada subcanal en cascada profunda
    const promesasSubcanales = subcanalesSnapshot.docs.map(async (subcanalDoc) => {
      
      // A. Por cada subcanal, traemos sus hilos
      const hilosRef = collection(subcanalDoc.ref, "hilos");
      const hilosSnapshot = await getDocs(hilosRef);

      const promesasHilos = hilosSnapshot.docs.map(async (hiloDoc) => {
        
        // B. Por cada hilo, traemos y borramos sus mensajes primero
        const mensajesRef = collection(hiloDoc.ref, "mensajes");
        const mensajesSnapshot = await getDocs(mensajesRef);
        const promesasMensajes = mensajesSnapshot.docs.map(msgDoc => deleteDoc(msgDoc.ref));
        await Promise.all(promesasMensajes);

        // C. Borramos el hilo en sí
        return deleteDoc(hiloDoc.ref);
      });

      // Esperamos a que se limpien los hilos y mensajes de este subcanal
      await Promise.all(promesasHilos);

      // D. Finalmente borramos el documento del subcanal
      return deleteDoc(subcanalDoc.ref);
    });

    // Esperamos a que se eliminen absolutamente todos los subcanales con sus contenidos
    await Promise.all(promesasSubcanales);

    // 4. Una vez la descendencia está limpia, borramos el Canal Padre
    await deleteDoc(canalRef);

    alert("Canal y todo su contenido eliminados con éxito.");

    // 5. Redirección de seguridad si el canal eliminado era el que estaba abierto
    router.push(`/dashboard/${empresaId}`);

  } catch (error) {
    console.error("Error al eliminar el canal en cascada profunda:", error);
    alert("Hubo un problema de permisos o conexión al intentar eliminar el canal.");
  }
};

  return (
    <div className="w-52 flex-shrink-0 bg-[#2b2d31] flex flex-col border-r border-white/10 h-full">
      <div className="h-14 p-4 border-b border-white/10 flex items-center justify-between shrink-0">
        <h2 className="text-white font-semibold text-sm uppercase tracking-wide">CANALES</h2>
        {esAdministrador && (
          <button
            onClick={() => {
              const nombre = prompt("Nombre del nuevo canal:");
              if (nombre) alCrearCanal(nombre);
            }}
            className="text-gray-400 hover:text-white text-xl"
            title="Crear canal"
          >
            +
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {cargando && <p className="text-gray-400 text-xs px-2 mt-2">Cargando canales...</p>}

        {!cargando && canales.length === 0 && (
          <p className="text-gray-400 text-xs px-2 mt-2">
            {esAdministrador ? "No hay canales. Crea el primero con +" : "No hay canales disponibles."}
          </p>
        )}

        {canales.map((canal) => (
          <div
            key={canal.id}
            onClick={() => alSeleccionarCanal(canal)}
            className={`group w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between cursor-pointer ${
              canalId === canal.id
                ? "bg-white/10 text-white" // O el color de selección que uses para tus canales
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <div className="flex items-center gap-2 overflow-hidden truncate">
              <span className="text-gray-500 flex-shrink-0">#</span>
              <span className="truncate">{canal.nombre}</span>
            </div>

            {/* 🗑️ BOTÓN DE ELIMINAR CANAL */}
            {esAdministrador && (
              <button
                onClick={(e) => handleEliminarCanal(e, canal)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-rose-500 transition-all p-1 text-xs ml-2 flex-shrink-0"
                title="Eliminar Canal"
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