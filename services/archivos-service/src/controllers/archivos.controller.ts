import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || "chat_upload";

// Carpeta donde se guardan los archivos cuando no hay Cloudinary configurado
export const CARPETA_LOCAL = path.join(process.cwd(), "uploads");

export async function subirArchivo(req: Request, res: Response) {
  const archivo = req.file;
  if (!archivo) {
    return res.status(400).json({ error: "Falta el archivo (debe llamarse 'archivo')" });
  }

  // multer lee mal las tildes de los nombres; esto lo corrige
  const nombre = Buffer.from(archivo.originalname, "latin1").toString("utf8");
  const tamano = `${Math.max(1, Math.round(archivo.size / 1024))} KB`;

  try {
    // Con Cloud name configurado: se sube a Cloudinary
    if (CLOUD_NAME) {
      const formulario = new FormData();
      formulario.append(
        "file",
        new Blob([new Uint8Array(archivo.buffer)], { type: archivo.mimetype }),
        nombre
      );
      formulario.append("upload_preset", UPLOAD_PRESET);

      const respuesta = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
        method: "POST",
        body: formulario,
      });
      const datos: any = await respuesta.json();

      if (!respuesta.ok || !datos.secure_url) {
        return res.status(502).json({ error: datos?.error?.message || "No se pudo subir el archivo" });
      }
      return res.status(201).json({ url: datos.secure_url, nombre, tipo: archivo.mimetype, tamano });
    }

    // Sin Cloud name: se guarda en la carpeta local "uploads"
    fs.mkdirSync(CARPETA_LOCAL, { recursive: true });
    const nombreGuardado = `${crypto.randomUUID()}${path.extname(nombre)}`;
    fs.writeFileSync(path.join(CARPETA_LOCAL, nombreGuardado), archivo.buffer);
    const base = process.env.URL_PUBLICA || `http://localhost:${process.env.PORT || 4005}`;
    const url = `${base}/archivos/${nombreGuardado}`;
    res.status(201).json({ url, nombre, tipo: archivo.mimetype, tamano });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al subir el archivo" });
  }
}