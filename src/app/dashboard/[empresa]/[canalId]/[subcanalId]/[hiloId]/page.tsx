"use client";

import { useParams } from "next/navigation";
import { useAutenticacion } from "@/hooks/useAuth";
import ChatArea from "@/components/chat/ChatArea";

export default function ChatPage() {
  const params = useParams();
  const { datosUsuario } = useAutenticacion();

  if (!datosUsuario) return null;

  return (
    <ChatArea 
      empresaId={params.empresa as string}
      canalId={params.canalId as string}
      subcanalId={params.subcanalId as string} // Asegúrate que params.subcanalId coincida con el nombre de tu carpeta
      hiloId={params.hiloId as string}
      datosUsuario={datosUsuario}
    />
  );
}