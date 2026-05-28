"use client";
export const dynamic = "force-dynamic";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAutenticacion } from "@/hooks/useAuth";

export default function LoginPage() {
  const { login, usuarioAuth, datosUsuario, cargando } = useAutenticacion();
  const router = useRouter();

  useEffect(() => {
    if (usuarioAuth && datosUsuario) {
      router.push("/dashboard");
    }
  }, [usuarioAuth, datosUsuario, router]);

  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error("Error al iniciar sesión", error);
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#10b981]"></div>
      </div>
    );
  }

  return (
    
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
      <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-200 max-w-md w-full text-center">
        <div className="text-4xl mb-6">👤</div>
        <h2 className="text-3xl font-bold text-[#1e293b] mb-2">Bienvenido de nuevo</h2>
        <p className="text-slate-500 mb-8 text-sm">
          Inicia sesión para acceder a tu panel de control y hilos de equipo.
        </p>

        <button 
          onClick={handleLogin}
          className="w-full py-4 bg-white border-2 border-slate-200 text-slate-900 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
        >
          <Image src="https://www.google.com/favicon.ico" alt="Google" width={20} height={20} className="w-5 h-5" />
          Ingresar con Google
        </button>
        
        {usuarioAuth && !datosUsuario && (
          <div className="mt-6 p-4 bg-amber-50 text-amber-700 rounded-xl text-sm border border-amber-100">
            Parece que no has completado tu registro. Por favor, vuelve a la página principal y selecciona &quot;Soy Empleado&quot; o &quot;Soy Empresa&quot; según corresponda.
          </div>
        )}

        <button 
          onClick={() => router.push("/")}
          className="mt-8 text-slate-400 text-sm hover:text-slate-600 transition-colors"
        >
          ← Volver al inicio
        </button>
      </div>
    </div>
  );
}