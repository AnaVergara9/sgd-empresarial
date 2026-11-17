import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { federation } from "@module-federation/vite";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const urlNavegacion = env.VITE_MF_NAVEGACION_URL || "http://localhost:5174";
  const urlChat = env.VITE_MF_CHAT_URL || "http://localhost:5175";

  return {
    plugins: [
      react(),
      federation({
        name: "shell",
        dts: false,
        remotes: {
          mf_navegacion: { type: "module", name: "mf_navegacion", entry: `${urlNavegacion}/remoteEntry.js` },
          mf_chat: { type: "module", name: "mf_chat", entry: `${urlChat}/remoteEntry.js` },
        },
        shared: {
          react: { singleton: true },
          "react-dom": { singleton: true },
        },
      }),
    ],
    resolve: { alias: { "@": path.resolve(__dirname, "src") } },
    build: { target: "esnext" },
  };
});