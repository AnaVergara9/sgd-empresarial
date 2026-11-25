import { defineConfig, searchForWorkspaceRoot } from "vite";
import react from "@vitejs/plugin-react";
import { federation } from "@module-federation/vite";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "mf_chat",
      filename: "remoteEntry.js",
      dts: false,
      exposes: {
        "./ChatArea": "./src/features/chat/components/ChatArea.tsx",
      },
      shared: {
        react: { singleton: true },
        "react-dom": { singleton: true },
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // Módulo local con Google Drive (adjuntar enlaces de Drive)
      "@sgd/google-drive-local": path.resolve(__dirname, "../../local-module/index.js"),
      // Módulo local sin conexión (cola de envíos y caché).
      "@local-module": path.resolve(__dirname, "../../local-module/src/index.ts"),
    },
  },
  server: {
    // Permite que el servidor de desarrollo sirva los archivos de local-module (fuera de esta carpeta)
    fs: {
      allow: [searchForWorkspaceRoot(process.cwd()), path.resolve(__dirname, "../../local-module")],
    },
    port: 5175,
    strictPort: true,
    origin: "http://localhost:5175",
    cors: true,
  },
  build: {
    target: "esnext",
  },
});
