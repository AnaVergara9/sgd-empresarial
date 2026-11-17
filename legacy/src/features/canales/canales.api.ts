const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function pedir<T = any>(url: string, opciones?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...opciones,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Error en la petición");
  }
  return res.json();
}

// Rutas de la jerarquía (se conservan porque otros archivos las usan)
export const rutaCanales = (empresaId: string) => ["empresas", empresaId, "canales"];
export const rutaSubcanales = (empresaId: string, canalId: string) => [...rutaCanales(empresaId), canalId, "subcanales"];
export const rutaHilos = (empresaId: string, canalId: string, subcanalId: string) =>
  [...rutaSubcanales(empresaId, canalId), subcanalId, "hilos"];
export const rutaMensajes = (empresaId: string, canalId: string, subcanalId: string, hiloId: string) =>
  [...rutaHilos(empresaId, canalId, subcanalId), hiloId, "mensajes"];

// Crea un canal, subcanal o hilo según la ruta que reciba.
// El último elemento dice qué es, y el penúltimo es el id del padre.
export const crear = (ruta: string[], nombre: string) => {
  const tipo = ruta[ruta.length - 1];
  const padreId = ruta[ruta.length - 2];

  if (tipo === "canales") {
    return pedir("/canales", { method: "POST", body: JSON.stringify({ empresaId: padreId, nombre }) });
  }
  if (tipo === "subcanales") {
    return pedir(`/canales/${padreId}/subcanales`, { method: "POST", body: JSON.stringify({ nombre }) });
  }
  if (tipo === "hilos") {
    return pedir(`/subcanales/${padreId}/hilos`, { method: "POST", body: JSON.stringify({ nombre }) });
  }
  throw new Error(`Ruta no soportada: ${ruta.join("/")}`);
};

export const eliminarCanal = (_empresaId: string, canalId: string) =>
  pedir(`/canales/${canalId}`, { method: "DELETE" });

export const eliminarSubcanal = (_empresaId: string, _canalId: string, subcanalId: string) =>
  pedir(`/subcanales/${subcanalId}`, { method: "DELETE" });

export const eliminarHilo = async (_empresaId: string, _canalId: string, _subcanalId: string, hiloId: string) => {
  await pedir(`/hilos/${hiloId}/mensajes`, { method: "DELETE" }); // chat-service
  return pedir(`/hilos/${hiloId}`, { method: "DELETE" });         // canales-service
};

// Funciones nuevas para leer (las usaremos en el siguiente paso)
export const listarCanales = (empresaId: string) =>
  pedir(`/canales?empresaId=${encodeURIComponent(empresaId)}`);
export const listarSubcanales = (canalId: string) => pedir(`/canales/${canalId}/subcanales`);
export const listarHilos = (subcanalId: string) => pedir(`/subcanales/${subcanalId}/hilos`);