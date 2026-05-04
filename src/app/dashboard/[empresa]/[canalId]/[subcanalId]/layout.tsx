import ColumnaHilos from "@/components/navigation/ColumnaHilos";

export default function AreaLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { empresaSlug: string; canalId: string; areaId: string };
}) {
  return (
    <>
      <ColumnaHilos 
        empresaId={params.empresaSlug} 
        canalId={params.canalId} 
        areaId={params.areaId} 
      />
      {children}
    </>
  );
}