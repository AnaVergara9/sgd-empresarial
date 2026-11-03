import { auth, db, googleProvider } from "@/shared/firebase";
import { doc, getDoc, setDoc, serverTimestamp, runTransaction } from "firebase/firestore";
import { onAuthStateChanged, signInWithPopup, signOut, User } from "firebase/auth";
import { Rol, Usuario } from "@/types";

// Escucha cuando alguien entra o sale. Devuelve la función para cancelar la suscripción.
export function escucharSesion(alCambiar: (usuario: User | null) => void) {
  return onAuthStateChanged(auth, alCambiar);
}

/**
 * Trae los datos del usuario desde Firestore.
 * Si es la primera vez que entra, crea un documento inicial (todavía sin empresa).
 */
export async function obtenerOCrearUsuario(usuario: User): Promise<Usuario> {
  const docRef = doc(db, "usuarios", usuario.uid);
  const docUsuario = await getDoc(docRef);
  if (docUsuario.exists()) {
    return docUsuario.data() as Usuario;
  }

  const usuarioInicial = {
    uid: usuario.uid,
    nombre: usuario.displayName || "Usuario",
    email: usuario.email || "",
    rol: "empleado", // Rol temporal inicial
    creadoEn: serverTimestamp(),
    estado: "activo",
  };
  await setDoc(docRef, usuarioInicial, { merge: true });
  return usuarioInicial as unknown as Usuario;
}

/**
 * Registra el perfil completo del usuario validando que la cédula no exista.
 * Se hace en una transacción para que dos registros simultáneos con la misma cédula no pasen ambos.
 */
export async function registrarNuevoUsuario(
  usuarioAuth: User,
  datos: { cedula: string; empresa: string; nombreEmpresa: string; cargo: string; rol: Rol }
): Promise<Usuario> {
  const nuevoUsuario: Usuario = {
    uid: usuarioAuth.uid,
    cedula: datos.cedula,
    nombre: usuarioAuth.displayName || "Usuario",
    cargo: datos.cargo,
    rol: datos.rol,
    email: usuarioAuth.email || "",
    empresa: datos.empresa, // El id de la empresa (se usa en la URL)
    nombreEmpresa: datos.nombreEmpresa, // Nombre comercial guardado directo en el usuario
    avatarColor: datos.rol === "admin" ? "#5865F2" : "#43b581", // Color por rol
    creadoEn: serverTimestamp(),
  };

  await runTransaction(db, async (transaccion) => {
    const rutaCedula = doc(db, "cedulas_registradas", datos.cedula);
    const informacionCedula = await transaccion.get(rutaCedula);

    // Si la cédula ya es de este mismo usuario (reintento), se permite continuar
    if (informacionCedula.exists() && informacionCedula.data().uid !== usuarioAuth.uid) {
      throw new Error("Esta cédula ya está registrada en el sistema.");
    }

    transaccion.set(rutaCedula, { uid: usuarioAuth.uid });
    transaccion.set(doc(db, "usuarios", usuarioAuth.uid), { ...nuevoUsuario, estado: "activo" });
  });

  return nuevoUsuario;
}

export async function iniciarSesionConGoogle() {
  await signInWithPopup(auth, googleProvider);
}

export async function cerrarSesion() {
  await signOut(auth);
}
