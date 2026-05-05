"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const [rolSeleccionado, setRolSeleccionado] = useState<"empresa" | "empleado" | null>(null);
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#1e1f22] text-white flex flex-col items-center p-6">
      {/* Header / Logo */}
      <header className="w-full max-w-6xl py-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tighter text-[#5865f2]">TU_LOGO</h1>
        <nav className="space-x-6 text-sm font-medium text-gray-400">
          <a href="#" className="hover:text-white transition-colors">Funcionalidades</a>
          <a href="#" className="hover:text-white transition-colors">Precios</a>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center max-w-3xl">
        <h2 className="text-5xl font-extrabold mb-6">
          La comunicación de tu empresa, <span className="text-[#5865f2]">organizada.</span>
        </h2>
        <p className="text-gray-400 text-lg mb-12">
          Gestiona canales, hilos y equipos en un solo lugar. Elige cómo quieres empezar hoy.
        </p>

        {/* Contenedor de Opciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          
          {/* Opción Empresa */}
          <div 
            onClick={() => router.push("/registro-empresa")}
            className="group p-8 bg-[#2b2d31] rounded-2xl border-2 border-transparent hover:border-[#5865f2] transition-all cursor-pointer text-left"
          >
            <div className="w-12 h-12 bg-[#5865f2]/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#5865f2] transition-colors">
              <span className="text-2xl">🏢</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Soy una Empresa</h3>
            <p className="text-gray-400 text-sm">
              Registra tu organización, crea departamentos y obtén un código único para tus empleados.
            </p>
          </div>

          {/* Opción Empleado */}
          <div 
            onClick={() => router.push("/unirse")}
            className="group p-8 bg-[#2b2d31] rounded-2xl border-2 border-transparent hover:border-[#43b581] transition-all cursor-pointer text-left"
          >
            <div className="w-12 h-12 bg-[#43b581]/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#43b581] transition-colors">
              <span className="text-2xl">🔑</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Soy un Empleado</h3>
            <p className="text-gray-400 text-sm">
              ¿Tienes un código de invitación? Ingrésalo aquí para unirte al equipo de tu empresa.
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}