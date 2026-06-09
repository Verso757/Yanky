import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ReactNode } from "react";

export function ProtectedRoute({ children, reqRoles }: { children: ReactNode, reqRoles?: string[] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (reqRoles && !reqRoles.includes(user.rol) && user.rol !== "ADMIN") {
    // Si no tiene permiso, lo mandamos al dashboard o a una de sus áreas seguras
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
