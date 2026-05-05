"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UnirseEquipo() {
  const [codigo, setCodigo] = useState("");
  const router = useRouter();

  const handleJoin = () => {
    // Aquí luego conectaremos con Firebase para validar el código
    console.log("Validando código:", codigo);
    if(codigo.length > 3) {
       router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
      <div className="bg-[#1e293b] p-10 rounded-[3rem] shadow-2xl max-w-md w-full text-center">
        <div className="text-4xl mb-6">🔑</div>
        <h2 className="text-3xl font-bold text-white mb-2">Unirse a un Equipo</h2>
        <p className="text-slate-400 mb-8 text-sm">
          Introduce el código único que te proporcionó tu administrador.
        </p>

        <input 
          type="text" 
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          placeholder="EJ: EMP-1234"
          className="w-full p-4 rounded-2xl bg-white/10 border border-white/20 text-white text-center text-xl font-mono tracking-widest focus:outline-none focus:border-[#10b981] mb-6"
        />

        <button 
          onClick={handleJoin}
          className="w-full py-4 bg-[#10b981] hover:bg-[#059669] text-white rounded-2xl font-bold transition-all"
        >
          Verificar Código
        </button>
        
        <button 
          onClick={() => router.back()}
          className="mt-6 text-slate-500 text-sm hover:text-white transition-colors"
        >
          ← Volver atrás
        </button>
      </div>
    </div>
  );
}