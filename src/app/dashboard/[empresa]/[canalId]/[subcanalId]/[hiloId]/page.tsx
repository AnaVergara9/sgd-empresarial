import ChatArea from "@/components/chat/ChatArea";

export default function ChatPage({ params }: { params: any }) {
  return (
    <ChatArea 
      empresaId={params.empresaSlug}
      canalId={params.canalId}
      subcanalId={params.areaId}
      hiloId={params.hiloId}
    />
  );
}