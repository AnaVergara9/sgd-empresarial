import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { Usuario } from "@/types";

export const authService = {
    registrarNuevoUsuario: async (datos: Usuario) => {
        try {
            const rutaCedula = doc(db, "cedulas_registradas", datos.cedula);
            const informacionCedula = await getDoc(rutaCedula);

            if (informacionCedula.exists()) {
                throw new Error("Esta cédula ya está registrada en el sistema.");
            }
            await setDoc(rutaCedula, { uid: datos.uid });

            const rutaUsuario = doc(db, "usuarios", datos.uid);
            await setDoc(rutaUsuario, {
                ...datos,
                rol: datos.rol || "empleado",
                empresa: datos.empresa,
                creadoEn: serverTimestamp(),
                estado: "activo"
            });
            return { success: true };
        } catch (error: any) {
            console.error("Error en el registro:", error.message);
            throw error;
        }
    },

    checkUserExists: async (uid: string) => {
        try {
            const docSnap = await getDoc(doc(db, "usuarios", uid));
            return docSnap.exists() ? docSnap.data() as Usuario : null;
        } catch (error) {
            console.error("Error checking user existence:", error);
            return null;
        }
    }
};
