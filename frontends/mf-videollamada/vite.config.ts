import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { federation } from "@module-federation/vite";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "mf_videollamada",
      filename: "remoteEntry.js",
      dts: false,
      exposes: {
        "./VideoLlamada": "./src/components/VideoLlamada.tsx",
      },
      shared: {
        react: { singleton: true },
        "react-dom": { singleton: true },
      },
    }),
  ],
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  server: {
    port: 5176,
    strictPort: true,
    origin: "http://localhost:5176",
    cors: true,
  },
  build: { target: "esnext" },
});
