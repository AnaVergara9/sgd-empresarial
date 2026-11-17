// La sesión ya la valida el layout principal del dashboard (dashboard/layout.tsx).
// Al retornar solo el <main> con {children}, este layout no pinta una segunda
// barra de canales ni un segundo encabezado.
export default function EmpresaLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 overflow-hidden h-full w-full">
      {children}
    </main>
  );
}
