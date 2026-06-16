import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Wrench, CircleDollarSign, Car, AlertTriangle, Clock, TrendingUp, TrendingDown, Users, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import axios from "@/src/lib/api";
import { useAuth } from "@/src/context/AuthContext";
import { motion } from "motion/react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function Dashboard() {
  const { user } = useAuth();
  const canViewFinances = ["ADMIN", "JEFE"].includes(user?.rol || "");
  const isRecepcion = user?.rol === "RECEPCIONISTA";
  const isAdminDemo = user?.email === 'admin@taller.com';

  const [stats, setStats] = useState({
    otsAbiertas: 0,
    ingresosMes: 0,
    cobrosPendientesDirectos: 0,
    cobrosPendientesSeguros: 0,
    vehiculosEnTaller: 0,
    nuevosClientes: 0,
    otsAsignadasPorEstado: [] as any[],
    otsSinAsignar: 0,
    entregasProximas: 0
  });

  // Mock data for charts
  const [ingresosData, setIngresosData] = useState(isAdminDemo ? [
    { name: 'Lun', ingresos: 4000, gastos: 2400 },
    { name: 'Mar', ingresos: 3000, gastos: 1398 },
    { name: 'Mié', ingresos: 2000, gastos: 9800 },
    { name: 'Jue', ingresos: 2780, gastos: 3908 },
    { name: 'Vie', ingresos: 1890, gastos: 4800 },
    { name: 'Sáb', ingresos: 2390, gastos: 3800 },
    { name: 'Dom', ingresos: 3490, gastos: 4300 },
  ] : []);

  const [rendimientoSemanal, setRendimientoSemanal] = useState(isAdminDemo ? [
    { name: 'Ene', ots: 65, completadas: 40 },
    { name: 'Feb', ots: 59, completadas: 30 },
    { name: 'Mar', ots: 80, completadas: 60 },
    { name: 'Abr', ots: 81, completadas: 75 },
    { name: 'May', ots: 56, completadas: 45 },
    { name: 'Jun', ots: 55, completadas: 40 },
  ] : []);

  useEffect(() => {
    // Aquí cargaríamos data real
    axios.get("/api/ordenes").then((res) => {
      if (Array.isArray(res.data)) {
        const ots = res.data;
        const abiertas = ots.filter((o: any) => ["INGRESADO", "EN_DIAGNOSTICO", "EN_PROCESO"].includes(o.estado));
        const sinAsignar = ots.filter((o: any) => o.estado === "INGRESADO" && !o.mecanicoAsignado);
        const porEntregar = ots.filter((o: any) => o.estado === "LISTO" || o.estado === "EN_PROCESO");
        
        // Calcular distribución de estados
        const estadosCount: Record<string, number> = {};
        ots.forEach(o => {
          estadosCount[o.estado] = (estadosCount[o.estado] || 0) + 1;
        });

        const otsAsignadasPorEstado = Object.keys(estadosCount).map(k => ({
          name: k,
          value: estadosCount[k]
        }));
        
        // Si es demo admin y no hay datos, ponemos unos fakes para la demo
        if (isAdminDemo && otsAsignadasPorEstado.length === 0) {
           otsAsignadasPorEstado.push(
             { name: 'INGRESADO', value: 5 },
             { name: 'EN_PROCESO', value: 12 },
             { name: 'LISTO', value: 3 },
             { name: 'ENTREGADO', value: 8 }
           );
        }

        setStats({
          otsAbiertas: (abiertas.length === 0 && isAdminDemo) ? 15 : abiertas.length,
          ingresosMes: ots.reduce((acc: number, o: any) => acc + (o.montoCobrado || 0), 0) || (isAdminDemo ? 45000 : 0),
          cobrosPendientesDirectos: ots
            .filter((o: any) => o.quienPaga === "CLIENTE")
             .reduce((acc: number, o: any) => acc + ((o.montoCotizado || 0) - (o.montoCobrado || 0)), 0) || (isAdminDemo ? 12000 : 0),
          cobrosPendientesSeguros: ots
            .filter((o: any) => o.quienPaga === "ASEGURADORA")
             .reduce((acc: number, o: any) => acc + ((o.montoCotizado || 0) - (o.montoCobrado || 0)), 0) || (isAdminDemo ? 28000 : 0),
          vehiculosEnTaller: abiertas.length + ots.filter((o: any) => o.estado === "LISTO").length || (isAdminDemo ? 18 : 0),
          nuevosClientes: isAdminDemo ? 12 : 0,
          otsAsignadasPorEstado,
          otsSinAsignar: sinAsignar.length || (isAdminDemo ? 3 : 0),
          entregasProximas: porEntregar.length || (isAdminDemo ? 2 : 0)
        });
      }
    }).catch(console.error);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard General</h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">Resumen de operaciones {canViewFinances ? "y finanzas " : ""}del taller.</p>
        </div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border-slate-200/60 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Wrench className="w-24 h-24" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-slate-600">OTs Activas</CardTitle>
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-inner">
              <Wrench className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold text-slate-900 tracking-tight">{stats.otsAbiertas}</div>
            <div className="flex items-center gap-2 mt-3">
              <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                <TrendingUp className="h-3 w-3 mr-1" />
                +14%
              </span>
              <span className="text-xs text-slate-400 font-medium">vs mes anterior</span>
            </div>
          </CardContent>
        </Card>

        {canViewFinances ? (
          <>
            <Card className="rounded-2xl border-slate-200/60 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <CircleDollarSign className="w-24 h-24" />
              </div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-semibold text-slate-600">Ingresos Mensuales</CardTitle>
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-inner">
                  <CircleDollarSign className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-4xl font-bold text-slate-900 tracking-tight">${stats.ingresosMes.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
                <div className="flex items-center gap-2 mt-3">
                  <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +8%
                  </span>
                  <span className="text-xs text-slate-400 font-medium">vs mes anterior</span>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200/60 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <AlertTriangle className="w-24 h-24" />
              </div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-semibold text-slate-600">Por Cobrar (Total)</CardTitle>
                <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center shadow-inner">
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-4xl font-bold text-slate-900 tracking-tight">${(stats.cobrosPendientesDirectos + stats.cobrosPendientesSeguros).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
                <div className="flex items-center gap-2 mt-3">
                  <span className="flex items-center text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-md">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +2% de atraso
                  </span>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card className="rounded-2xl border-slate-200/60 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <AlertTriangle className="w-24 h-24" />
              </div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-semibold text-slate-600">OTs por Asignar</CardTitle>
                <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center shadow-inner">
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-4xl font-bold text-slate-900 tracking-tight">{stats.otsSinAsignar}</div>
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-xs text-orange-600 font-medium">Pendientes de revisión</span>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200/60 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Car className="w-24 h-24" />
              </div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-semibold text-slate-600">Vehículos en Taller</CardTitle>
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-inner">
                  <Car className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-4xl font-bold text-slate-900 tracking-tight">{stats.vehiculosEnTaller}</div>
                <div className="flex items-center gap-2 mt-3">
                  <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Capacidad normal
                  </span>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        <Card className="rounded-2xl border-slate-200/60 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Users className="w-24 h-24" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-slate-600">Nuevos Clientes</CardTitle>
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-inner">
              <Users className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold text-slate-900 tracking-tight">{stats.nuevosClientes}</div>
            <div className="flex items-center gap-2 mt-3">
              <span className="flex items-center text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-md">
                <TrendingDown className="h-3 w-3 mr-1" />
                -5%
              </span>
              <span className="text-xs text-slate-400 font-medium">vs mes anterior</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Ingresos vs Gastos (Semanal) */}
        {canViewFinances && (
          <Card className="col-span-1 lg:col-span-2 shadow-sm rounded-2xl border-slate-200/60">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-slate-800">Flujo de Caja Semanal</CardTitle>
              <CardDescription className="text-sm">Comparativa de ingresos facturados vs gastos de operación.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ingresosData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}/>
                    <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIngresos)" />
                    <Area type="monotone" dataKey="gastos" name="Gastos" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorGastos)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rendimiento Anual (Ingresos vs Completadas) - Visible for all, but takes full width if finances hidden */}
        <Card className={`shadow-sm rounded-2xl border-slate-200/60 ${canViewFinances ? 'col-span-1 lg:col-span-3' : 'col-span-1 lg:col-span-2'}`}>
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-800">Rendimiento Operativo (Semestral)</CardTitle>
            <CardDescription className="text-sm">Relación entre órdenes de trabajo creadas y completadas.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rendimientoSemanal} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}/>
                  <Bar dataKey="ots" name="OTs Recibidas" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="completadas" name="OTs Completadas" fill="#8b5cf6" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Distribución de Estados */}
        <Card className="col-span-1 shadow-sm rounded-2xl border-slate-200/60">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-800">Estado del Taller</CardTitle>
            <CardDescription className="text-sm">Distribución de órdenes por estado actual.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.otsAsignadasPorEstado}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {stats.otsAsignadasPorEstado.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#1e293b', fontSize: '14px', fontWeight: '500' }}
                  />
                  <Legend iconType="circle" layout="horizontal" verticalAlign="bottom" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      <div className="grid gap-4 md:grid-cols-3">
         <Card className="col-span-1 border-l-4 border-l-orange-500 shadow-sm bg-orange-50/30">
           <CardHeader className="py-4">
             <CardTitle className="text-base text-orange-800 flex items-center">
               <AlertTriangle className="h-4 w-4 mr-2" />
               ATENCIÓN: Entregas (&lt; 48h)
             </CardTitle>
           </CardHeader>
           <CardContent className="pb-4">
             <p className="text-sm text-slate-600">{stats.entregasProximas} OTs próximas a entrega crítica (o listas para entregar).</p>
           </CardContent>
         </Card>
         
         <Card className={`col-span-1 border-l-4 ${stats.otsSinAsignar > 0 ? "border-l-indigo-500 bg-indigo-50/30" : "border-l-slate-400 bg-slate-50/50"} shadow-sm`}>
           <CardHeader className="py-4">
             <CardTitle className={`text-base ${stats.otsSinAsignar > 0 ? "text-indigo-800" : "text-slate-800"} flex items-center`}>
               <Wrench className="h-4 w-4 mr-2" />
               OTs Sin Asignar
             </CardTitle>
           </CardHeader>
           <CardContent className="pb-4">
             <p className="text-sm text-slate-600">{stats.otsSinAsignar} OTs esperando diagnóstico o asignación de mecánico.</p>
           </CardContent>
         </Card>
         
         <Card className="col-span-1 border-l-4 border-l-red-500 shadow-sm bg-red-50/30">
           <CardHeader className="py-4">
             <CardTitle className="text-base text-red-800 flex items-center">
               <Clock className="h-4 w-4 mr-2" />
               Garantías (vencen &lt; 30d)
             </CardTitle>
           </CardHeader>
           <CardContent className="pb-4">
             <p className="text-sm text-slate-600">3 garantías a punto de expirar. Se sugiere contactar a los clientes.</p>
           </CardContent>
         </Card>
      </div>
    </motion.div>
  );
}
