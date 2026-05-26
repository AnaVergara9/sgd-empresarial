// app/dashboard/[empresa]/[canalId]/page.tsx
"use client";

export default function CanalPage() {
  return (
    <div className="flex-1 bg-[#313338] flex flex-col items-center justify-center text-zinc-400 text-sm">
      <p className="text-lg font-semibold text-white mb-1">¡Te damos la bienvenida al canal!</p>
      <p>Selecciona un subcanal para ver los hilos</p>
    </div>
  );
}