import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/features/auth/AuthContext";
import Inicio from "@/pages/Inicio";
import Login from "@/pages/Login";
import RegistroEmpresa from "@/pages/RegistroEmpresa";
import Unirse from "@/pages/Unirse";
import Dashboard from "@/pages/Dashboard";

// AuthProvider envuelve todas las rutas: la sesión se carga una sola vez y se comparte
export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro-empresa" element={<RegistroEmpresa />} />
        <Route path="/unirse" element={<Unirse />} />
        <Route path="/dashboard/*" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}