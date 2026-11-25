import { defineConfig, loadEnv, searchForWorkspaceRoot } from "vite";
import react from "@vitejs/plugin-react";
import { federation } from "@module-federation/vite";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const urlNavegacion = env.VITE_MF_NAVEGACION_URL || "http://localhost:5174";
  const urlChat = env.VITE_MF_CHAT_URL || "http://localhost:5175";
  const urlVideollamada = env.VITE_MF_VIDEOLLAMADA_URL || "http://localhost:5176";

  return {
    plugins: [
      react(),
      federation({
        name: "shell",
        dts: false,
        remotes: {
          mf_navegacion: { type: "module", name: "mf_navegacion", entry: `${urlNavegacion}/remoteEntry.js` },
          mf_chat: { type: "module", name: "mf_chat", entry: `${urlChat}/remoteEntry.js` },
          mf_videollamada: { type: "module", name: "mf_videollamada", entry: `${urlVideollamada}/remoteEntry.js` },
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
        // Módulo local (perfil guardado para entrar sin conexión). En Docker se copia a /local-module.
        "@local-module": path.resolve(__dirname, "../../local-module/src/index.ts"),
      },
    },
    server: {
      // Permite que el servidor de desarrollo sirva los archivos de local-module (fuera de esta carpeta)
      fs: {
        allow: [searchForWorkspaceRoot(process.cwd()), path.resolve(__dirname, "../../local-module")],
      },
    },
    build: { target: "esnext" },
  };
});
