import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { Usuario } from "@/types";

export const registrarNuevoUsuario = async (datos: Usuario)=> {
    try {
        const rutaCedula = doc(db, "cedulas_registradas", datos.cedula); // Se guardan las cédulas registradas para evitar duplicados
        const informacionCedula = await getDoc(rutaCedula); //Se obtiene la información de esa ruta (si existe o no)

        if (informacionCedula.exists()) {
            throw new Error("Esta cédula ya está registrada en el sistema.");
        }
        await setDoc(rutaCedula, {uid: datos.uid}); // Si no existe, se reserva para ese usuario (cedula)

        //Se crea el perfil completo en la carpeta de usuarios
        const rutaUsuario = doc(db, "usuarios", datos.uid);
        await setDoc(rutaUsuario, {
            ...datos,
            creadoEn: serverTimestamp(), 
        });
            return { success: true };
    } catch (error: any) {
        console.error("Error en el registro:", error.message);
        throw error;
    }
};
