import "dotenv/config";
import express from "express";
import cors from "cors";
import { iniciarDB } from "./db";
import canalesRoutes from "./routes/canales.routes";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ servicio: "canales-service", estado: "ok" });
});

app.use(canalesRoutes);

const PUERTO = process.env.PORT || 4003;

iniciarDB()
  .then(() => {
    console.log("Conectado a la base de datos, tablas canales, subcanales e hilos listas");
    app.listen(PUERTO, () => {
      console.log(`canales-service escuchando en el puerto ${PUERTO}`);
    });
  })
  .catch((error) => {
    console.error("No se pudo conectar a la base de datos:", error);
  });