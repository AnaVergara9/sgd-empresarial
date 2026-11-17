import "dotenv/config";
import express from "express";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";

const servicios = {
  "auth-service": process.env.AUTH_URL || "http://127.0.0.1:4001",
  "empresa-service": process.env.EMPRESA_URL || "http://127.0.0.1:4002",
  "canales-service": process.env.CANALES_URL || "http://127.0.0.1:4003",
  "chat-service": process.env.CHAT_URL || "http://127.0.0.1:4004",
  "archivos-service": process.env.ARCHIVOS_URL || "http://127.0.0.1:4005",
};

const app = express();
app.use(cors());
// OJO: aquí NO va express.json(). El gateway solo reenvía las peticiones
// tal como llegan; si leyera el contenido, los servicios recibirían todo vacío.

app.get("/health", (_req, res) => {
  res.json({ servicio: "gateway", estado: "ok" });
});

// Pregunta a cada servicio si está encendido
app.get("/health/servicios", async (_req, res) => {
  const resultados = await Promise.all(
    Object.entries(servicios).map(async ([nombre, url]) => {
      try {
        const r = await fetch(`${url}/health`, { signal: AbortSignal.timeout(2000) });
        return [nombre, r.ok ? "ok" : "con problemas"];
      } catch {
        return [nombre, "apagado"];
      }
    })
  );
  res.json(Object.fromEntries(resultados));
});

// 1) Chat primero: /hilos/:id/mensajes se parece a /hilos/:id de canales
app.use(
  createProxyMiddleware({
    target: servicios["chat-service"],
    changeOrigin: true,
    pathFilter: (ruta) => /^\/hilos\/[^/]+\/mensajes/.test(ruta) || ruta.startsWith("/mensajes"),
  })
);

// 2) Auth
app.use(
  createProxyMiddleware({
    target: servicios["auth-service"],
    changeOrigin: true,
    pathFilter: "/auth",
  })
);

// 3) Empresas
app.use(
  createProxyMiddleware({
    target: servicios["empresa-service"],
    changeOrigin: true,
    pathFilter: "/empresas",
  })
);

// 4) Canales, subcanales e hilos
app.use(
  createProxyMiddleware({
    target: servicios["canales-service"],
    changeOrigin: true,
    pathFilter: ["/canales", "/subcanales", "/hilos"],
  })
);

// 5) Archivos
app.use(
  createProxyMiddleware({
    target: servicios["archivos-service"],
    changeOrigin: true,
    pathFilter: "/archivos",
  })
);

// Cualquier otra dirección no existe
app.use((_req, res) => {
  res.status(404).json({ error: "Ruta no encontrada en el gateway" });
});

const PUERTO = process.env.PORT || 4000;

app.listen(PUERTO, () => {
  console.log(`gateway escuchando en el puerto ${PUERTO}`);
});