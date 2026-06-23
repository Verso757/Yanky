/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import { LayoutDashboard, Wrench, Users, Car, Menu, X, Shield, DollarSign, Award, FileSignature, LogOut, UserCircle, Download, WifiOff } from "lucide-react";
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
import { AnimatePresence, motion } from "motion/react";

function Navigation() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, isLoading } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  const isActive = (path: string) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
  };

  const allNavItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard, roles: ["ADMIN", "JEFE", "RECEPCIONISTA", "TECNICO"] },
    { name: "Presupuestos", path: "/presupuestos", icon: FileSignature, roles: ["ADMIN", "JEFE", "RECEPCIONISTA"] },
    { name: "Órdenes de Trabajo", path: "/ordenes", icon: Wrench, roles: ["ADMIN", "JEFE", "RECEPCIONISTA", "TECNICO"] },
    { name: "Directorio", path: "/clientes", icon: Users, roles: ["ADMIN", "JEFE", "RECEPCIONISTA"] },
    { name: "Aseguradoras", path: "/aseguradoras", icon: Shield, roles: ["ADMIN", "JEFE", "RECEPCIONISTA"] },
    { name: "Finanzas", path: "/finanzas", icon: DollarSign, roles: ["ADMIN", "JEFE"] },
    { name: "Garantías", path: "/garantias", icon: Award, roles: ["ADMIN", "JEFE", "RECEPCIONISTA"] },
    { name: "Usuarios", path: "/usuarios", icon: UserCircle, roles: ["ADMIN", "JEFE"] },
  ];

  const navItems = allNavItems.filter(item => user?.rol === "ADMIN" || item.roles.includes(user?.rol || ""));

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  if (isLoading) {
    return null; 
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 flex-col bg-white border-r border-slate-200/60 shadow-sm z-10 transition-all">
        <div className="h-20 flex items-center px-8 font-bold text-xl tracking-tight text-slate-900 border-b border-slate-100">
          <div className="bg-blue-600 text-white p-2 rounded-xl mr-3 shadow-md shadow-blue-600/20">
            <Wrench className="w-5 h-5" />
          </div>
          Yanky Taller
        </div>
        <nav className="flex-1 overflow-y-auto py-6 px-4">
          <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-4 px-4">Menu Principal</div>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <li key={item.path}>
                  <Link 
                    to={item.path} 
                    className={`flex items-center px-4 py-3 rounded-xl font-medium transition-all duration-200 group relative overflow-hidden ${
                      active 
                        ? 'text-blue-700 bg-blue-50/80 shadow-sm ring-1 ring-blue-100' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    {active && (
                      <motion.div 
                        layoutId="active-nav"
                        className="absolute left-0 w-1 h-full bg-blue-600 rounded-r-full"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <Icon className={`h-5 w-5 mr-3 transition-colors ${active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
          {isOffline && (
            <div className="mb-4 flex items-center justify-center space-x-2 bg-orange-50 text-orange-600 px-3 py-2 rounded-xl text-sm font-medium border border-orange-100">
              <WifiOff className="w-4 h-4" />
              <span>Modo sin conexión</span>
            </div>
          )}
          
          {deferredPrompt && (
            <button 
              onClick={handleInstallClick}
              className="mb-4 w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Instalar App</span>
            </button>
          )}
          <div className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm border border-slate-200/60">
            <div className="flex items-center gap-3 overflow-hidden">
               <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                  {user.nombre.charAt(0).toUpperCase()}
               </div>
              <div className="text-sm truncate">
                <p className="font-semibold text-slate-900 truncate">{user.nombre}</p>
                <p className="text-xs text-slate-500 font-medium">{user.rol}</p>
              </div>
            </div>
            <button onClick={logout} className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50" title="Cerrar sesión">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`fixed flex flex-col inset-y-0 left-0 bg-white w-[280px] shadow-2xl z-50 transform transition-transform duration-300 ease-in-out md:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
         <div className="h-20 flex items-center justify-between px-6 border-b border-slate-100">
          <div className="font-bold text-xl tracking-tight text-slate-900 flex items-center">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg mr-3 shadow-md shadow-blue-600/20">
              <Wrench className="w-5 h-5" />
            </div>
            Yanky
          </div>
          <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="overflow-y-auto py-6 px-4 flex-1">
          <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-4 px-4">Menu</div>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <li key={item.path}>
                  <Link 
                    to={item.path} 
                    className={`flex items-center px-4 py-3 rounded-xl font-medium transition-colors ${
                      active 
                        ? 'text-blue-700 bg-blue-50/80' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
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
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 mt-auto">
          {isOffline && (
            <div className="mb-4 flex items-center justify-center space-x-2 bg-orange-50 text-orange-600 px-3 py-2 rounded-xl text-sm font-medium border border-orange-100">
              <WifiOff className="w-4 h-4" />
              <span>Modo sin conexión</span>
            </div>
          )}
          
          {deferredPrompt && (
            <button 
              onClick={handleInstallClick}
              className="mb-4 w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Instalar App</span>
            </button>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center">
                  {user.nombre.charAt(0).toUpperCase()}
               </div>
              <div className="text-sm">
                <p className="font-semibold text-slate-900">{user.nombre}</p>
                <p className="text-xs text-slate-500">{user.rol}</p>
              </div>
            </div>
            <button onClick={logout} className="text-slate-400 hover:text-red-600 p-2" title="Cerrar sesión">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#FAFAFA]">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between h-16 px-4 bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-md transition-colors">
            <Menu className="h-6 w-6" />
          </button>
          <div className="font-bold text-lg text-slate-900 flex items-center gap-2">
            Yanky Taller
            <div className="bg-blue-600 text-white p-1 rounded-md shadow-sm">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto max-w-[1400px]">
             <AnimatePresence mode="wait">
               {/* @ts-ignore */}
               <Routes location={location} key={location.pathname}>
                 <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                 <Route path="/presupuestos" element={<ProtectedRoute reqRoles={["ADMIN", "JEFE", "RECEPCIONISTA"]}><Presupuestos /></ProtectedRoute>} />
                 <Route path="/ordenes/*" element={<ProtectedRoute><Ordenes /></ProtectedRoute>} />
                 <Route path="/clientes" element={<ProtectedRoute reqRoles={["ADMIN", "JEFE", "RECEPCIONISTA"]}><Clientes /></ProtectedRoute>} />
                 <Route path="/aseguradoras" element={<ProtectedRoute reqRoles={["ADMIN", "JEFE", "RECEPCIONISTA"]}><Aseguradoras /></ProtectedRoute>} />
                 <Route path="/finanzas" element={<ProtectedRoute reqRoles={["ADMIN", "JEFE"]}><Finanzas /></ProtectedRoute>} />
                 <Route path="/garantias" element={<ProtectedRoute reqRoles={["ADMIN", "JEFE", "RECEPCIONISTA"]}><Garantias /></ProtectedRoute>} />
                 <Route path="/usuarios" element={<ProtectedRoute reqRoles={["ADMIN", "JEFE"]}><Usuarios /></ProtectedRoute>} />
               </Routes>
             </AnimatePresence>
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

