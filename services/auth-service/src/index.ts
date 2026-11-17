import "dotenv/config";
import express from "express";
import cors from "cors";
import { iniciarDB } from "./db";
import authRoutes from "./routes/auth.routes";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ servicio: "auth-service", estado: "ok" });
});
app.use("/auth", authRoutes);

const PUERTO = process.env.PORT || 4001;

iniciarDB()
  .then(() => {
    console.log("Conectado a la base de datos, tabla usuarios lista");
    app.listen(PUERTO, () => {
      console.log(`auth-service escuchando en el puerto ${PUERTO}`);
    });
  })
  .catch((error) => {
    console.error("No se pudo conectar a la base de datos:", error.message);
  });