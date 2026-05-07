"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { empresaService } from "@/services/empresaService";
import { useAutenticacion } from "@/hooks/useAuth";
import { authService } from "@/services/authService";
import Image from "next/image";

export default function UnirseEquipo() {
  const [paso, setPaso] = useState(1); // 1: Codigo, 2: Auth, 3: Perfil
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [empresaEncontrada, setEmpresaEncontrada] = useState<any>(null);
  const [cedula, setCedula] = useState("");
  const [cargo, setCargo] = useState("");
  
  const router = useRouter();
  const { login, usuarioAuth, datosUsuario, configurarPerfil } = useAutenticacion();

  // Si el usuario ya está autenticado y tiene datos, lo mandamos al dashboard
  useEffect(() => {
    if (usuarioAuth && datosUsuario) {
      router.push("/dashboard");
    }
  }, [usuarioAuth, datosUsuario, router]);

  const handleVerifyCode = async () => {
    setError("");
    if (codigo.length < 3) {
      setError("El código debe ser válido.");
      return;
    }

    try {
      const empresa = await empresaService.obtenerEmpresaPorCodigo(codigo);
      if (empresa) {
        setEmpresaEncontrada(empresa);
        setPaso(2);
      } else {
        setError("Código de empresa no válido.");
      }
    } catch (err) {
      setError("Error al verificar el código.");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await login();
      // El useEffect se encargará de ver si el usuario ya existe
      // Pero para forzar el paso si no existe:
      const existe = await authService.checkUserExists(usuarioAuth?.uid || "");
      if (!existe) {
          setPaso(3);
      }
    } catch (err) {
      setError("Error al iniciar sesión con Google.");
    }
  };

  // Efecto adicional para detectar cuando el usuario se loguea pero no tiene datos
  useEffect(() => {
    if (usuarioAuth && !datosUsuario && paso === 2) {
      setPaso(3);
    }
  }, [usuarioAuth, datosUsuario, paso]);

  const handleCompletarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await configurarPerfil(cedula, empresaEncontrada.nombre, cargo);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
      <div className="bg-[#1e293b] p-10 rounded-[3rem] shadow-2xl max-w-md w-full text-center">
        <div className="text-4xl mb-6">🔑</div>
        
        {paso === 1 && (
          <>
            <h2 className="text-3xl font-bold text-white mb-2">Unirse a un Equipo</h2>
            <p className="text-slate-400 mb-8 text-sm">
              Introduce el código único de tu organización.
            </p>
            <input 
              type="text" 
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              placeholder="EJ: EMP-1234"
              className="w-full p-4 rounded-2xl bg-white/10 border border-white/20 text-white text-center text-xl font-mono tracking-widest focus:outline-none focus:border-[#10b981] mb-4"
            />
            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
            <button 
              onClick={handleVerifyCode}
              className="w-full py-4 bg-[#10b981] hover:bg-[#059669] text-white rounded-2xl font-bold transition-all"
            >
              Verificar Código
            </button>
          </>
        )}

        {paso === 2 && (
          <>
            <div className="mb-4 text-[#10b981] font-bold text-lg">✓ Código Válido</div>
            <h2 className="text-2xl font-bold text-white mb-2">Bienvenido a {empresaEncontrada?.nombre}</h2>
            <p className="text-slate-400 mb-8 text-sm">
              Para continuar, por favor autentícate con tu cuenta de Google.
            </p>
            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
            <button 
              onClick={handleGoogleLogin}
              className="w-full py-4 bg-white text-slate-900 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-100 transition-all"
            >
              <img src="https://www.google.com/favicon.ico" alt="icono" width={20} height={20} className="w-5 h-5" />
              Continuar con Google
            </button>
          </>
        )}

        {paso === 3 && (
          <>
            <h2 className="text-2xl font-bold text-white mb-2">Casi listo</h2>
            <p className="text-slate-400 mb-8 text-sm">
              Necesitamos unos datos adicionales para completar tu registro en <b>{empresaEncontrada?.nombre}</b>.
            </p>
            <form onSubmit={handleCompletarPerfil} className="space-y-4 text-left">
              <div>
                <label className="text-xs font-bold text-slate-400 ml-2 uppercase">Cédula</label>
                <input 
                  required
                  type="text"
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                  placeholder="Tu número de identificación"
                  className="w-full p-4 rounded-2xl bg-white/10 border border-white/20 text-white focus:outline-none focus:border-[#10b981]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 ml-2 uppercase">Cargo</label>
                <input 
                  required
                  type="text"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  placeholder="Ej: Analista de Datos"
                  className="w-full p-4 rounded-2xl bg-white/10 border border-white/20 text-white focus:outline-none focus:border-[#10b981]"
                />
              </div>
              {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
              <button 
                type="submit"
                className="w-full py-4 bg-[#10b981] hover:bg-[#059669] text-white rounded-2xl font-bold transition-all mt-4"
              >
                Completar Registro
              </button>
            </form>
          </>
        )}
        
        <button 
          onClick={() => {
            if(paso > 1) setPaso(paso - 1);
            else router.push("/");
          }}
          className="mt-6 text-slate-500 text-sm hover:text-white transition-colors"
        >
          ← {paso === 1 ? "Volver atrás" : "Regresar"}
        </button>
      </div>
    </div>
  );
}