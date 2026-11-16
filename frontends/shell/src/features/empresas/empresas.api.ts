const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export interface EmpresaEncontrada {
  id: string;
  nombre: string;
}

// El código de acceso lo genera el backend, por eso ya no se envía.
// Se mantienen los parámetros _codigo y _userId para no romper a quien llama a la función.
export async function registrarNuevaEmpresa(nombre: string, nit: string, _codigo: string, _userId: string) {
  const res = await fetch(`${API}/empresas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, nit }),
  });
  const empresa = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(empresa.error || "Error al registrar la empresa");

  return empresa.id as string;
}

export async function obtenerEmpresaPorCodigo(codigo: string): Promise<EmpresaEncontrada | null> {
  const res = await fetch(`${API}/empresas/codigo/${encodeURIComponent(codigo.trim().toUpperCase())}`);
  if (res.status === 404) return null;

  const datos = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(datos.error || "Error al buscar la empresa");

  return { id: datos.id, nombre: datos.nombre };
}