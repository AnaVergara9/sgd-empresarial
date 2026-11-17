"use client";

import { useParams } from "next/navigation";
import { useAuthContext } from "@/features/auth/AuthContext";
import ChatArea from "@/features/chat/components/ChatArea";

export default function ChatPage() {
  const params = useParams();
  const { datosUsuario } = useAuthContext();

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