"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegistroEmpresa() {
  const [nombreEmpresa, setNombreEmpresa] = useState("");
  const [cedula, setCedula] = useState("");
  const router = useRouter();

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Lógica para generar el código único
    // Tomamos las primeras 3 letras de la empresa y los últimos 4 de la cédula
    const prefix = nombreEmpresa.substring(0, 3).toUpperCase();
    const suffix = cedula.slice(-4);
    const codigoGenerado = `${prefix}-${suffix}`;

    console.log("Empresa Registrada:", { nombreEmpresa, cedula, codigoGenerado });
    
    // Aquí es donde luego guardaremos en Firebase con el código generado
    alert(`¡Empresa registrada! Tu código para empleados es: ${codigoGenerado}`);
    router.push("/"); 
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
      <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-slate-200 max-w-lg w-full">
        
        <div className="text-center mb-10">
          <div className="text-4xl mb-4 text-[#10b981]">🏢</div>
          <h1 className="text-3xl font-extrabold text-[#1e293b]">Registrar Empresa</h1>
          <p className="text-slate-500 mt-2">Configura tu organización en pocos pasos.</p>
        </div>

        <form onSubmit={handleRegistro} className="space-y-6">
          {/* Campo Nombre de Empresa */}
          <div>
            <label className="block text-sm font-bold text-[#1e293b] mb-2 ml-2">
              Nombre de la Organización
            </label>
            <input 
              required
              type="text" 
              placeholder="Ej: Tech Solutions"
              value={nombreEmpresa}
              onChange={(e) => setNombreEmpresa(e.target.value)}
              className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#10b981] text-slate-700 transition-all"
            />
          </div>

          {/* Campo Cédula/NIT */}
          <div>
            <label className="block text-sm font-bold text-[#1e293b] mb-2 ml-2">
              Cédula o NIT de la empresa
            </label>
            <input 
              required
              type="text" 
              placeholder="123456789"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#10b981] text-slate-700 transition-all"
            />
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-[#10b981] hover:bg-[#059669] text-white rounded-2xl font-bold text-lg shadow-lg shadow-emerald-200 transition-all hover:scale-[1.02] active:scale-95"
          >
            Crear Empresa y Generar Código
          </button>
        </form>

        <button 
          onClick={() => router.back()}
          className="w-full mt-6 text-slate-400 text-sm hover:text-slate-600 font-medium transition-colors"
        >
          ← Volver a la selección
        </button>
      </div>
    </div>
  );
}