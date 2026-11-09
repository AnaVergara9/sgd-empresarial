import { Router } from "express";
import multer from "multer";
import { subirArchivo } from "../controllers/archivos.controller";

const router = Router();

// El archivo se recibe en memoria y no puede pasar de 10 MB
const recibirArchivo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.post("/archivos", recibirArchivo.single("archivo"), subirArchivo);

export default router;