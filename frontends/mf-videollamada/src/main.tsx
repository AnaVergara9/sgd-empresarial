import React from "react";
import ReactDOM from "react-dom/client";
import VideoLlamada from "./components/VideoLlamada";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <div className="min-h-screen bg-[#111827] p-8 text-white">
      <p className="mx-auto mb-4 max-w-3xl text-sm text-slate-300">
        Esta vista es solo para desarrollar el microfrontend. En la aplicación,
        abre un hilo para ver sus controles de videollamada.
      </p>
      <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-[#1f2937] p-6">
        <VideoLlamada
          hiloId="00000000-0000-4000-8000-000000000001"
          usuarioUid="usuario-demo"
          usuarioNombre="Usuario de prueba"
        />
      </div>
    </div>
  </React.StrictMode>
);
