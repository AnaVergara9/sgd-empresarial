import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { federation } from "@module-federation/vite";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    federation({ 
      dts: false,
      name: "shell",
      remotes: {
        mf_navegacion: {
          type: "module",
          name: "mf_navegacion",
          entry: "http://localhost:5174/remoteEntry.js",
        },
      },
      shared: {
        react: { singleton: true },
        "react-dom": { singleton: true },
      },
    }),
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  build: {
    target: "esnext",
  },
});