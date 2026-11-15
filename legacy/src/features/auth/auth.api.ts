import { auth, googleProvider } from "@/shared/firebase";
import { onAuthStateChanged, signInWithPopup, signOut, User } from "firebase/auth";
import { Rol, Usuario } from "@/types";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function pedir<T = any>(url: string, opciones?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...opciones,
  });
  const datos = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(datos.error || "Error en la petición");
  return datos;
}

// El backend devuelve snake_case y valores null; los componentes esperan los nombres de antes.
function adaptarUsuario(fila: any): Usuario {
  return {
    ...fila,
    empresa: fila.empresa_id ?? undefined,
    nombreEmpresa: fila.nombre_empresa ?? undefined,
    avatarColor: fila.avatar_color ?? undefined,
    creadoEn: fila.creado_en,
    cedula: fila.cedula ?? undefined,
    cargo: fila.cargo ?? undefined,
  } as unknown as Usuario;
}

// Escucha cuando alguien entra o sale. Devuelve la función para cancelar la suscripción.
export function escucharSesion(alCambiar: (usuario: User | null) => void) {
  return onAuthStateChanged(auth, alCambiar);
}

/**
 * Trae los datos del usuario desde el backend.
 * Si es la primera vez que entra, el backend crea el registro inicial (todavía sin empresa).
 */
export async function obtenerOCrearUsuario(usuario: User): Promise<Usuario> {
  const fila = await pedir("/auth/sesion", {
    method: "POST",
    body: JSON.stringify({
      uid: usuario.uid,
      nombre: usuario.displayName || "Usuario",
      email: usuario.email || "",
    }),
  });
  return adaptarUsuario(fila);
}

/**
 * Registra el perfil completo del usuario. El backend valida que la cédula no esté repetida.
 */
export async function registrarNuevoUsuario(
  usuarioAuth: User,
  datos: { cedula: string; empresa: string; nombreEmpresa: string; cargo: string; rol: Rol }
): Promise<Usuario> {
  // Se asegura de que el usuario exista en el backend antes de completar el perfil
  await obtenerOCrearUsuario(usuarioAuth);

  const fila = await pedir("/auth/perfil", {
    method: "PUT",
    body: JSON.stringify({
      uid: usuarioAuth.uid,
      cedula: datos.cedula,
      cargo: datos.cargo,
      rol: datos.rol,
      empresaId: datos.empresa,
      nombreEmpresa: datos.nombreEmpresa,
    }),
  });
  return adaptarUsuario(fila);
}

export async function iniciarSesionConGoogle() {
  await signInWithPopup(auth, googleProvider);
}

export async function cerrarSesion() {
  await signOut(auth);
}