import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { inicializarSenalizacion } from "./socket";

const app = express();
app.use(cors());

app.get("/health", (_req, res) => {
  res.json({ servicio: "videollamada-service", estado: "ok" });
});

const server = createServer(app);
const puerto = Number(process.env.PORT) || 4006;

inicializarSenalizacion(server)
  .then(() => {
    server.listen(puerto, () => {
      console.log(`videollamada-service escuchando en el puerto ${puerto}`);
    });
  })
  .catch((error) => {
    console.error("No se pudo iniciar videollamada-service:", error);
    process.exit(1);
  });
