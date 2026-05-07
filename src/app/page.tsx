"use client";

import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 font-sans">
      {/* Encabezado Estilo Dashboard */}
      <div className="mb-12 text-center">
        <span className="text-[#10b981] font-semibold text-sm tracking-widest uppercase">Bienvenido al Sistema</span>
        <h1 className="text-4xl font-extrabold text-[#1e293b] mt-2">¿Cómo deseas ingresar hoy?</h1>
        <p className="text-[#64748b] mt-4">Selecciona tu perfil para acceder a las herramientas personalizadas.</p>
      </div>

      {/* Contenedor de Tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
        
        {/* Tarjeta de Empresa (Admin) */}
        <button 
          onClick={() => router.push("/registro-empresa")}
          className="group relative bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 text-left flex flex-col items-start"
        >
          <div className="w-14 h-14 bg-[#10b981]/10 rounded-2xl flex items-center justify-center mb-6 text-2xl group-hover:bg-[#10b981] group-hover:text-white transition-colors duration-300">
            🏢
          </div>
          <div className="flex items-center justify-between w-full mb-4">
            <h2 className="text-xl font-bold text-[#1e293b]">Soy Empresa</h2>
          </div>
          <p className="text-[#64748b] text-sm leading-relaxed mb-8">
            Registra tu organización y gestiona a tu equipo desde cero.
          </p>
          <div className="mt-auto flex items-center text-[#10b981] font-bold group-hover:gap-4 transition-all text-sm">
            Configurar Empresa <span className="ml-2">→</span>
          </div>
        </button>

        {/* Tarjeta de Empleado */}
        <button 
          onClick={() => router.push("/unirse")}
          className="group relative bg-[#1e293b] p-8 rounded-[2rem] border border-slate-800 shadow-2xl hover:shadow-[#1e293b]/20 hover:-translate-y-2 transition-all duration-300 text-left flex flex-col items-start"
        >
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-6 text-2xl group-hover:bg-white group-hover:text-[#1e293b] transition-colors duration-300">
            🔑
          </div>
          <div className="flex items-center justify-between w-full mb-4">
            <h2 className="text-xl font-bold text-white">Soy Empleado</h2>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            Ingresa con el código de tu empresa para empezar a reportar.
          </p>
          <div className="mt-auto flex items-center text-white font-bold group-hover:gap-4 transition-all text-sm">
            Ingresar Código <span className="ml-2">→</span>
          </div>
        </button>

        {/* Tarjeta de Iniciar Sesión (Nueva) */}
        <button 
          onClick={() => router.push("/login")}
          className="group relative bg-white p-8 rounded-[2rem] border-2 border-dashed border-slate-200 hover:border-[#10b981] hover:bg-emerald-50/30 transition-all duration-300 text-left flex flex-col items-start"
        >
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-6 text-2xl group-hover:bg-[#10b981] group-hover:text-white transition-colors duration-300">
            👤
          </div>
          <div className="flex items-center justify-between w-full mb-4">
            <h2 className="text-xl font-bold text-[#1e293b]">Ya tengo cuenta</h2>
          </div>
          <p className="text-[#64748b] text-sm leading-relaxed mb-8">
            Si ya te has registrado antes, inicia sesión directamente aquí.
          </p>
          <div className="mt-auto flex items-center text-[#10b981] font-bold group-hover:gap-4 transition-all text-sm">
            Iniciar Sesión <span className="ml-2">→</span>
          </div>
        </button>

      </div>

      {/* Footer Minimalista */}
      <footer className="mt-16 text-slate-400 text-xs">
        Plataforma de Monitoreo Empresarial v2.0
      </footer>
    </div>
  );
}