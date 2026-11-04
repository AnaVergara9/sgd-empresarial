import { db } from "@/shared/firebase";
import { collection, addDoc, query, where, getDocs, doc, updateDoc, serverTimestamp } from "firebase/firestore";

export interface EmpresaEncontrada {
  id: string;
  nombre: string;
}

export async function registrarNuevaEmpresa(nombre: string, nit: string, codigo: string, userId: string) {
  const docRef = await addDoc(collection(db, "empresas"), {
    nombre,
    nit,
    codigoAcceso: codigo,
    createdAt: serverTimestamp(),
  });

  await updateDoc(doc(db, "usuarios", userId), {
    empresa: docRef.id,
    nombreEmpresa: nombre,
  });

  return docRef.id;
}

export async function obtenerEmpresaPorCodigo(codigo: string): Promise<EmpresaEncontrada | null> {
  const q = query(collection(db, "empresas"), where("codigoAcceso", "==", codigo.trim().toUpperCase()));
  const resultado = await getDocs(q);
  if (resultado.empty) return null;

  const documento = resultado.docs[0];
  return { id: documento.id, nombre: documento.data().nombre };
}
