import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import archivosRoutes from "./routes/archivos.routes";
import { CARPETA_LOCAL } from "./controllers/archivos.controller";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ servicio: "archivos-service", estado: "ok" });
});

// Permite abrir en el navegador los archivos guardados en modo local
app.use("/archivos", express.static(CARPETA_LOCAL));

app.use(archivosRoutes);

// Respuesta clara si el archivo es demasiado grande
app.use((error: any, _req: Request, res: Response, _next: NextFunction) => {
  if (error.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "El archivo supera los 10 MB" });
  }
  console.error(error);
  res.status(500).json({ error: "Error en el servidor" });
});

const PUERTO = process.env.PORT || 4005;

app.listen(PUERTO, () => {
  const destino = process.env.CLOUDINARY_CLOUD_NAME ? "Cloudinary" : "carpeta local (uploads)";
  console.log(`archivos-service escuchando en el puerto ${PUERTO}, guardando en: ${destino}`);
});