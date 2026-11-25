import { defineConfig } from "vite";
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
      "@sgd/google-drive-local": path.resolve(__dirname, "../../local-module/index.js"),
    },
  },
  server: {
    port: 5175,
    strictPort: true,
    origin: "http://localhost:5175",
    cors: true,
    fs: { allow: [path.resolve(__dirname, "../../local-module")] },
  },
  build: {
    target: "esnext",
  },
});
