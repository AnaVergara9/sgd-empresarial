import ColumnaCanales from "@/components/navigation/ColumnaCanales";
import Encabezado from "@/components/modules/Encabezado";

interface LayoutProps {
  children: React.ReactNode;
  params: { empresa: string };
}

export default function EmpresaLayout({ children, params }: LayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-[#1e1f22]">
      {/* Aquí pasas params.empresa. Si ColumnaCanales pide 'empresaId', se lo das así: */}
      <ColumnaCanales empresaId={params.empresa} />
      <div className="flex-1 flex overflow-hidden">
        {children}
      </div>
    </div>
  );
}