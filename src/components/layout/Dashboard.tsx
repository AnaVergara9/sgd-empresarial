"use client";

import { useState } from "react";
import { Usuario, Canal, Subcanal, Hilo } from "@/types";

import ColumnaCanales from "../navigation/ColumnaCanales";
import ColumnaSubcanales from "../navigation/ColumnaSubcanales";
import ColumnaHilos from "../navigation/Hilos";
import ChatArea from "../chat/ChatArea";
import Encabezado from "../modules/Encabezado";

interface PropiedadesDashboard {
  datosUsuario: Usuario;
  alCerrarSesion: () => void;
}

export default function Dashboard({ datosUsuario, alCerrarSesion }: PropiedadesDashboard) {
  const [canalActivo, setCanalActivo] = useState<Canal | null>(null);
  const [subcanalActivo, setSubcanalActivo] = useState<Subcanal | null>(null);
  const [hiloActivo, setHiloActivo] = useState<Hilo | null>(null);

  const esAdministrador = datosUsuario.rol === "admin";


  return (
    <div className="flex flex-col h-screen bg-[#1e1f22] text-white overflow-hidden">
      <Encabezado datosUsuario={datosUsuario} alCerrarSesion={alCerrarSesion} />

      <div className="flex flex-1 overflow-hidden">

        {/* Columna 1 — siempre visible */}
        <ColumnaCanales
          canalActivo={canalActivo}
          alSeleccionarCanal={(canal) => {
            setCanalActivo(canal);
            setSubcanalActivo(null);
            setHiloActivo(null);
          }}
          esAdministrador={esAdministrador}
          alCrearCanal={crearCanal}
        />

        {/* Columna 2 — visible solo si hay canal activo */}
        {canalActivo && (
          <ColumnaSubcanales
            canalActivo={canalActivo}
            subcanalActivo={subcanalActivo}
            alSeleccionarSubcanal={(subcanal) => {
              setSubcanalActivo(subcanal);
              setHiloActivo(null);
            }}
            esAdministrador={esAdministrador}
            alCrearSubcanal={crearSubcanal}
          />
        )}

        {/* Columna 3 — visible solo si hay subcanal activo */}
        {canalActivo && subcanalActivo && (
          <ColumnaHilos
            canalActivo={canalActivo}
            subcanalActivo={subcanalActivo}
            hiloActivo={hiloActivo}
            alSeleccionarHilo={setHiloActivo}
            esAdministrador={esAdministrador}
            alCrearHilo={crearHilo}
          />
        )}

        {/* Chat — visible solo si hay hilo activo */}
        {hiloActivo ? (
          <ChatArea
            canalActivo={canalActivo}
            subcanalActivo={subcanalActivo}
            hiloActivo={hiloActivo}
            datosUsuario={datosUsuario}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-[#313338]">
            <p className="text-gray-400 text-sm">
              {!canalActivo && "Selecciona un canal para comenzar"}
              {canalActivo && !subcanalActivo && "Selecciona un subcanal"}
              {canalActivo && subcanalActivo && !hiloActivo && "Selecciona un hilo para ver el chat"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}