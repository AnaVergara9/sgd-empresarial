
import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { createServer } from "http";

import mensajesRoutes from "./routes/mensajes.routes";
import { inicializarSocket } from "./socket";

const app = express();

// Configuración de Express
app.use(cors());
app.use(express.json());

// Ruta para comprobar el estado del servicio
app.get("/health", (_req, res) => {
  res.json({
    servicio: "chat-service",
    estado: "ok",
  });
});

// Rutas del chat
app.use(mensajesRoutes);

const PUERTO = Number(process.env.PORT) || 4004;

// Creamos el servidor HTTP
const server = createServer(app);

// Iniciamos la aplicación
async function iniciarServidor() {
  try {
    // Conexión con MongoDB
    await mongoose.connect(process.env.MONGO_URL as string);
    console.log("Conectado a MongoDB");

    // Inicialización de Socket.IO y Redis
    await inicializarSocket(server);

    // Iniciamos el servidor HTTP
    server.listen(PUERTO, () => {
      console.log(
        `chat-service escuchando en el puerto ${PUERTO}`
      );
      console.log("Socket.IO está disponible");
    });

  } catch (error) {
    console.error("Error al iniciar chat-service:", error);
    process.exit(1);
  }
}

iniciarServidor();
