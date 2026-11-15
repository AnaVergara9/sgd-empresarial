//import { db } from "@/shared/firebase";
//import { doc, updateDoc } from "firebase/firestore";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface EmpresaEncontrada {
  id: string;
  nombre: string;
}

export async function registrarNuevaEmpresa(nombre: string, nit: string, _codigo: string, userId: string) {
  // El código de acceso lo genera el backend, por eso ya no se envía
  const res = await fetch(`${API}/empresas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, nit }),
  });
  const empresa = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(empresa.error || "Error al registrar la empresa");

  // TEMPORAL: el perfil del usuario sigue en Firestore hasta migrar auth.api.ts
  /*await updateDoc(doc(db, "usuarios", userId), {
    empresa: empresa.id,
    nombreEmpresa: nombre,
  });*/

  return empresa.id as string;
}

export async function obtenerEmpresaPorCodigo(codigo: string): Promise<EmpresaEncontrada | null> {
  const res = await fetch(`${API}/empresas/codigo/${encodeURIComponent(codigo.trim().toUpperCase())}`);
  if (res.status === 404) return null;

  const datos = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(datos.error || "Error al buscar la empresa");

  return { id: datos.id, nombre: datos.nombre };
}