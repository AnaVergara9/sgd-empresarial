import "dotenv/config";
import express from "express";
import cors from "cors";
import { iniciarDB } from "./db";
import empresaRoutes from "./routes/empresa.routes";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ servicio: "empresa-service", estado: "ok" });
});

app.use("/empresas", empresaRoutes);

const PUERTO = process.env.PORT || 4002;

iniciarDB()
  .then(() => {
    console.log("Conectado a la base de datos, tabla empresas lista");
    app.listen(PUERTO, () => {
      console.log(`empresa-service escuchando en el puerto ${PUERTO}`);
    });
  })
  .catch((error) => {
    console.error("No se pudo conectar a la base de datos:", error.message);
  });