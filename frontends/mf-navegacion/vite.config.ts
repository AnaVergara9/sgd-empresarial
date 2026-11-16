import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { federation } from "@module-federation/vite";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    federation({
      dts: false,
      name: "mf_navegacion",
      filename: "remoteEntry.js",
      exposes: {
        "./ColumnaCanales": "./src/features/canales/components/ColumnaCanales.tsx",
        "./ColumnaSubcanales": "./src/features/canales/components/ColumnaSubcanales.tsx",
        "./ColumnaHilos": "./src/features/canales/components/ColumnaHilos.tsx",
      },
      // React se comparte con el shell para que haya una sola copia
      shared: {
        react: { singleton: true },
        "react-dom": { singleton: true },
      },
    }),
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  server: {
    port: 5174,
    strictPort: true, // si el 5174 está ocupado, falla en vez de cambiar de puerto
    origin: "http://localhost:5174",
    cors: true, // el shell (otro puerto) debe poder pedirle archivos
  },
  build: {
    target: "esnext",
  },
});