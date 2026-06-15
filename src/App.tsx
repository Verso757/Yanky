/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import { LayoutDashboard, Wrench, Users, Car, Menu, X, Shield, DollarSign, Award, FileSignature, LogOut, UserCircle } from "lucide-react";
import Dashboard from "./pages/Dashboard";
import Ordenes from "./pages/Ordenes";
import Clientes from "./pages/Clientes";
import Aseguradoras from "./pages/Aseguradoras";
import Finanzas from "./pages/Finanzas";
import Garantias from "./pages/Garantias";
import Presupuestos from "./pages/Presupuestos";
import Usuarios from "./pages/Usuarios";
import Login from "./pages/Login";
import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

function Navigation() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, isLoading } = useAuth();

  const isActive = (path: string) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
  };

  const allNavItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard, roles: ["ADMIN", "JEFE", "RECEPCIONISTA", "TECNICO"] },
    { name: "Presupuestos", path: "/presupuestos", icon: FileSignature, roles: ["ADMIN", "JEFE", "RECEPCIONISTA"] },
    { name: "Órdenes de Trabajo", path: "/ordenes", icon: Wrench, roles: ["ADMIN", "JEFE", "RECEPCIONISTA", "TECNICO"] },
    { name: "Clientes y Vehículos", path: "/clientes", icon: Users, roles: ["ADMIN", "JEFE", "RECEPCIONISTA"] },
    { name: "Aseguradoras", path: "/aseguradoras", icon: Shield, roles: ["ADMIN", "JEFE", "RECEPCIONISTA"] },
    { name: "Finanzas", path: "/finanzas", icon: DollarSign, roles: ["ADMIN", "JEFE"] },
    { name: "Garantías", path: "/garantias", icon: Award, roles: ["ADMIN", "JEFE", "RECEPCIONISTA"] },
    { name: "Usuarios", path: "/usuarios", icon: UserCircle, roles: ["ADMIN", "JEFE"] },
  ];

  // Filtramos por rol
  const navItems = allNavItems.filter(item => user?.rol === "ADMIN" || item.roles.includes(user?.rol || ""));

  // Close sidebar on navigation on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  if (isLoading) {
    return null; // Don't redirect while loading Auth
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-white border-r border-neutral-200">
        <div className="h-16 flex items-center px-6 border-b border-neutral-200 font-bold text-xl tracking-tight text-blue-900 bg-slate-50">
          <Wrench className="w-5 h-5 mr-2 text-blue-600" />
          Yanky Taller
        </div>
        <nav className="flex-1 overflow-y-auto py-6">
          <ul className="space-y-1.5 px-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <li key={item.path}>
                  <Link 
                    to={item.path} 
                    className={`flex items-center px-3 py-2.5 rounded-md font-medium transition-colors ${
                      active 
                        ? 'bg-blue-50 text-blue-700' 
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`h-5 w-5 mr-3 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="p-4 border-t border-neutral-200">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <p className="font-medium text-slate-700">{user.nombre}</p>
              <p className="text-xs text-slate-500">{user.rol}</p>
            </div>
            <button onClick={logout} className="text-slate-500 hover:text-red-600" title="Cerrar sesión">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`fixed flex flex-col inset-y-0 left-0 bg-white w-64 border-r border-neutral-200 z-50 transform transition-transform duration-200 ease-in-out md:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-neutral-200 bg-slate-50">
          <div className="font-bold text-xl tracking-tight text-blue-900 flex items-center">
            <Wrench className="w-5 h-5 mr-2 text-blue-600" />
            Yanky
          </div>
          <button onClick={() => setSidebarOpen(false)} className="text-slate-500 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="overflow-y-auto py-6">
          <ul className="space-y-1.5 px-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <li key={item.path}>
                  <Link 
                    to={item.path} 
                    className={`flex items-center px-3 py-2.5 rounded-md font-medium transition-colors ${
                      active 
                        ? 'bg-blue-50 text-blue-700' 
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`h-5 w-5 mr-3 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="p-4 border-t border-neutral-200 mt-auto">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <p className="font-medium text-slate-700">{user.nombre}</p>
              <p className="text-xs text-slate-500">{user.rol}</p>
            </div>
            <button onClick={logout} className="text-slate-500 hover:text-red-600" title="Cerrar sesión">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Trigger & Header */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50">
        <header className="md:hidden flex items-center justify-between h-16 px-4 bg-white border-b border-neutral-200">
          <div className="font-bold text-lg text-blue-900 flex items-center">
            <Wrench className="w-5 h-5 mr-2 text-blue-600" />
            Yanky Taller
          </div>
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-600">
            <Menu className="h-6 w-6" />
          </button>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto max-w-6xl">
            <Routes>
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/presupuestos" element={<ProtectedRoute reqRoles={["ADMIN", "JEFE", "RECEPCIONISTA"]}><Presupuestos /></ProtectedRoute>} />
              <Route path="/ordenes/*" element={<ProtectedRoute><Ordenes /></ProtectedRoute>} />
              <Route path="/clientes" element={<ProtectedRoute reqRoles={["ADMIN", "JEFE", "RECEPCIONISTA"]}><Clientes /></ProtectedRoute>} />
              <Route path="/aseguradoras" element={<ProtectedRoute reqRoles={["ADMIN", "JEFE", "RECEPCIONISTA"]}><Aseguradoras /></ProtectedRoute>} />
              <Route path="/finanzas" element={<ProtectedRoute reqRoles={["ADMIN", "JEFE"]}><Finanzas /></ProtectedRoute>} />
              <Route path="/garantias" element={<ProtectedRoute reqRoles={["ADMIN", "JEFE", "RECEPCIONISTA"]}><Garantias /></ProtectedRoute>} />
              <Route path="/usuarios" element={<ProtectedRoute reqRoles={["ADMIN", "JEFE"]}><Usuarios /></ProtectedRoute>} />
            </Routes>
          </div>
        </main>
      </div>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={
            <div className="flex h-screen w-full overflow-hidden">
              <Navigation />
            </div>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

