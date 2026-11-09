import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import mensajesRoutes from "./routes/mensajes.routes";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ servicio: "chat-service", estado: "ok" });
});

app.use(mensajesRoutes);

const PUERTO = process.env.PORT || 4004;

mongoose
  .connect(process.env.MONGO_URL as string)
  .then(() => {
    console.log("Conectado a MongoDB");
    app.listen(PUERTO, () => {
      console.log(`chat-service escuchando en el puerto ${PUERTO}`);
    });
  })
  .catch((error) => {
    console.error("No se pudo conectar a MongoDB:", error);
  });