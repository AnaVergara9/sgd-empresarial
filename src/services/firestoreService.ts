import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export const crearCanalService = async (nombre: string, empresaId: string) => {
  return await addDoc(collection(db, "empresas", empresaId, "canales"), {
    nombre,
    descripcion: "", // Mantenemos tu campo descripcion
    creadoEn: serverTimestamp(),
  })
}

export const firestoreService = {
  crearCanal: async (nombre: string, empresaId: string) => {
    return await addDoc(collection(db, "empresas", empresaId, "canales"), {
      nombre,
      creadoEn: serverTimestamp(),
    });
  },
  
  crearSubcanal: async (nombre: string, empresaId: string, canalId: string) => {
    return await addDoc(collection(db, "empresas", empresaId, "canales", canalId, "subcanales"), {
      nombre,
      creadoEn: serverTimestamp(),
    });
  },

  crearHilo: async (nombre: string, empresaId: string, canalId: string, subcanalId: string) => {
    return await addDoc(
      collection(db, "empresas", empresaId, "canales", canalId, "subcanales", subcanalId, "hilos"), 
      {
        nombre,
        creadoEn: serverTimestamp(),
      }
    );
  }
}