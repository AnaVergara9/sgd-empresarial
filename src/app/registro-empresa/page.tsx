"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { empresaService } from "@/services/empresaService";
import { useAutenticacion } from "@/hooks/useAuth";
import { authService } from "@/services/authService";

export default function RegistroEmpresa() {
  const [paso, setPaso] = useState(1);
  const [nombreEmpresa, setNombreEmpresa] = useState("");
  const [nitEmpresa, setNitEmpresa] = useState("");
  const [codigoGenerado, setCodigoGenerado] = useState("");
  const [cedulaUsuario, setCedulaUsuario] = useState("");
  const [cargoUsuario, setCargoUsuario] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const { login, usuarioAuth, configurarPerfil } = useAutenticacion();

  // Generar código Acceso
  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();

    if (nombreEmpresa.length < 3 || nitEmpresa.length < 5) {
      setError("Completa correctamente los datos");
      return;
    }

    const prefix = nombreEmpresa.substring(0, 3).toUpperCase();
    const suffix = nitEmpresa.slice(-4);
    const code = `${prefix}-${suffix}`;

    setCodigoGenerado(code);
    setPaso(2);
  };

  // Guardar TODO
  const handleFinalizarRegistro = async () => {
    try {
      if (!usuarioAuth) throw new Error("Debes iniciar sesión");

      if (!cedulaUsuario) throw new Error("Ingresa la cédula");

      // 1. Crear empresa
      const empresaId = await empresaService.registrarNuevaEmpresa(nombreEmpresa, nitEmpresa,codigoGenerado, usuarioAuth?.uid);


      await configurarPerfil(cedulaUsuario, empresaId, nombreEmpresa, cargoUsuario, "admin");

      // 3. Ir al dashboard
      router.push(`/dashboard/${empresaId}`);

    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
      <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-slate-200 max-w-lg w-full">

        {/* HEADER */}
        <div className="text-center mb-10">
          <div className="text-4xl mb-4 text-[#10b981]">🏢</div>
          <h1 className="text-3xl font-extrabold text-[#1e293b]">
            Registrar Empresa
          </h1>
          <p className="text-slate-500 mt-2">
            {paso === 1 && "Configura tu organización en pocos pasos."}
            {paso === 2 && "Casi listo, ahora vincula tu cuenta administrativa."}
            {paso === 3 && "Completa tu perfil de administrador."}
          </p>
        </div>

        {/* PASO 1 */}
        {paso === 1 && (
          <form onSubmit={handleNextStep} className="space-y-6">

            <div>
              <label className="block text-sm font-bold text-[#1e293b] mb-2 ml-2 uppercase tracking-wide">
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

            <div>
              <label className="block text-sm font-bold text-[#1e293b] mb-2 ml-2 uppercase tracking-wide">
                NIT de la empresa
              </label>
              <input
                required
                type="text"
                placeholder="123456789"
                value={nitEmpresa}
                onChange={(e) => setNitEmpresa(e.target.value)}
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#10b981] text-slate-700 transition-all"
              />
            </div>

            {error && <p className="text-red-500 text-sm ml-2">{error}</p>}

            <button
              type="submit"
              className="w-full py-4 bg-[#10b981] hover:bg-[#059669] text-white rounded-2xl font-bold text-lg shadow-lg shadow-emerald-200 transition-all hover:scale-[1.02] active:scale-95"
            >
              Siguiente: Vincular Admin
            </button>
          </form>
        )}

        {/* PASO 2 */}
        {paso === 2 && (
          <div className="space-y-6">

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-sm text-slate-500 mb-1">
                Código generado:
              </p>
              <p className="text-2xl font-mono font-bold text-[#1e293b] tracking-widest">
                {codigoGenerado}
              </p>
            </div>

            <p className="text-slate-600 text-sm">
              Inicia sesión con Google para continuar como administrador.
            </p>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              onClick={async () => {
                await login();
                setPaso(3);
              }}
              className="w-full py-4 bg-white border-2 border-slate-200 text-slate-900 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-50 transition-all"
            >
              <Image
                src="https://www.google.com/favicon.ico"
                alt="Google"
                width={20}
                height={20}
                className="w-5 h-5"
              />
              Autenticar con Google
            </button>
          </div>
        )}

        {/* PASO 3 */}
        {paso === 3 && (
          <div className="space-y-6">
            <input
              required
              type="text"
              placeholder="Cédula"
              value={cedulaUsuario}
              onChange={(e) => setCedulaUsuario(e.target.value)}
              className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#10b981] text-slate-700 transition-all"
            />

            <input
              type="text"
              placeholder="Cargo"
              value={cargoUsuario}
              onChange={(e) => setCargoUsuario(e.target.value)}
              className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#10b981] text-slate-700 transition-all"
            />

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              onClick={handleFinalizarRegistro}
              className="w-full py-4 bg-[#10b981] text-white rounded-2xl font-bold hover:bg-[#059669] transition-all"
            >
              Finalizar registro
            </button>
          </div>
        )}

        {/* VOLVER */}
        {paso < 3 && (
          <button
            onClick={() => {
              if (paso > 1) setPaso(paso - 1);
              else router.back();
            }}
            className="w-full mt-6 text-slate-400 text-sm hover:text-slate-600"
          >
            ← Volver
          </button>
        )}
      </div>
    </div>
  );
}