import ColumnaSubcanales from "@/components/navigation/ColumnaSubcanales";

export default function CanalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { empresaSlug: string; canalId: string };
}) {
  return (
    <>
      <ColumnaSubcanales 
        empresaId={params.empresaSlug} 
        canalId={params.canalId} 
      />
      {children}
    </>
  );
}