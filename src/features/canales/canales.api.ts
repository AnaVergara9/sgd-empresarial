import { db } from "@/shared/firebase";
import { eliminarEnCascada } from "@/shared/firestore";
import { collection, addDoc, doc, serverTimestamp } from "firebase/firestore";

// Rutas de la jerarquía: empresas/{e}/canales/{c}/subcanales/{s}/hilos/{h}/mensajes
export const rutaCanales = (empresaId: string) => ["empresas", empresaId, "canales"];
export const rutaSubcanales = (empresaId: string, canalId: string) => [...rutaCanales(empresaId), canalId, "subcanales"];
export const rutaHilos = (empresaId: string, canalId: string, subcanalId: string) =>
  [...rutaSubcanales(empresaId, canalId), subcanalId, "hilos"];
export const rutaMensajes = (empresaId: string, canalId: string, subcanalId: string, hiloId: string) =>
  [...rutaHilos(empresaId, canalId, subcanalId), hiloId, "mensajes"];

// Crea un canal, subcanal o hilo dentro de la colección indicada
export const crear = (ruta: string[], nombre: string) =>
  addDoc(collection(db, ruta.join("/")), {
    nombre,
    creadoEn: serverTimestamp(),
  });

export const eliminarCanal = (empresaId: string, canalId: string) =>
  eliminarEnCascada(doc(db, [...rutaCanales(empresaId), canalId].join("/")), ["subcanales", "hilos", "mensajes"]);

export const eliminarSubcanal = (empresaId: string, canalId: string, subcanalId: string) =>
  eliminarEnCascada(doc(db, [...rutaSubcanales(empresaId, canalId), subcanalId].join("/")), ["hilos", "mensajes"]);

export const eliminarHilo = (empresaId: string, canalId: string, subcanalId: string, hiloId: string) =>
  eliminarEnCascada(doc(db, [...rutaHilos(empresaId, canalId, subcanalId), hiloId].join("/")), ["mensajes"]);
