import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs, doc, updateDoc } from "firebase/firestore";

export const empresaService = {
  registrarNuevaEmpresa: async (nombre: string, nit: string, codigo: string, userId: string) => {
    try {
      const docRef = await addDoc(collection(db, "empresas"), {
        nombre,
        nit,
        codigoAcceso: codigo,
        createdAt: new Date(),
      });

      const empresaId = docRef.id;
      const usuarioRef = doc(db, "usuarios", userId);
      await updateDoc(usuarioRef, {
        empresa: empresaId,
        nombreEmpresa: nombre
      });

      return empresaId;
    } catch (error) {
      throw error;
    }
  },

  obtenerEmpresaPorCodigo: async (codigo: string) => {
    try {
      const q = query(collection(db, "empresas"), where("codigoAcceso", "==", codigo));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error("Error al obtener empresa:", error);
      throw error;
    }
  }
};