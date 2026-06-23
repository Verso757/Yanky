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
    entregasProximas: 0,
    rendimientoTecnicos: [] as any[]
  });
  const [isLoading, setIsLoading] = useState(true);

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
        const tecnicosStats: Record<string, { asignadas: number, completadas: number, nombre: string }> = {};

        ots.forEach(o => {
          estadosCount[o.estado] = (estadosCount[o.estado] || 0) + 1;
          
          if (o.mecanicoAsignado && o.nombreMecanicoAsignado) {
             if (!tecnicosStats[o.mecanicoAsignado]) {
                tecnicosStats[o.mecanicoAsignado] = { asignadas: 0, completadas: 0, nombre: o.nombreMecanicoAsignado };
             }
             tecnicosStats[o.mecanicoAsignado].asignadas++;
             if (o.estado === "LISTO" || o.estado === "ENTREGADO") {
                tecnicosStats[o.mecanicoAsignado].completadas++;
             }
          }
        });

        const rendimientoArray = Object.values(tecnicosStats).sort((a,b) => b.completadas - a.completadas);

        const otsAsignadasPorEstado = Object.keys(estadosCount).map(k => ({
          name: k,
          value: estadosCount[k]
        }));
        
        // Si es demo admin y no hay datos, ponemos unos fakes para el pastel
        if (isAdminDemo && otsAsignadasPorEstado.length === 0) {
           otsAsignadasPorEstado.push(
             { name: 'INGRESADO', value: 5 },
             { name: 'EN_PROCESO', value: 12 },
             { name: 'LISTO', value: 3 },
             { name: 'ENTREGADO', value: 8 }
           );
        }

        // Fakes para rendimiento (si no hay ninguno asignado)
        if (isAdminDemo && rendimientoArray.length === 0) {
           rendimientoArray.push(
             { nombre: "Carlos Méndez", asignadas: 15, completadas: 12 },
             { nombre: "Luis Fernando", asignadas: 10, completadas: 8 },
             { nombre: "Roberto Gómez", asignadas: 8, completadas: 2 }
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
          entregasProximas: porEntregar.length || (isAdminDemo ? 2 : 0),
          rendimientoTecnicos: rendimientoArray
        });
      }
    }).catch(console.error).finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-slate-500 font-medium">Cargando métricas...</span>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard General</h1>
          <p className="text-slate-500 mt-1 text-sm">Resumen de operaciones {canViewFinances ? "y finanzas " : ""}del taller.</p>
        </div>
      </div>
      
      {/* Alertas */}
      <div className="grid gap-4 md:grid-cols-3">
         <Card className="col-span-1 border-l-4 border-l-orange-500 shadow-sm bg-white hover:bg-slate-50 transition-colors">
           <CardHeader className="py-3 pb-1">
             <CardTitle className="text-sm font-semibold text-orange-800 flex items-center uppercase tracking-wider">
               <AlertTriangle className="h-4 w-4 mr-2" />
               Entregas Próximas
             </CardTitle>
           </CardHeader>
           <CardContent className="pb-3 text-sm text-slate-600">
             <span className="font-bold text-orange-700 text-lg mr-1">{stats.entregasProximas}</span> OTs <span className="opacity-80">listas o críticas.</span>
           </CardContent>
         </Card>
         
         <Card className={`col-span-1 border-l-4 ${stats.otsSinAsignar > 0 ? "border-l-indigo-500" : "border-l-slate-400"} shadow-sm bg-white hover:bg-slate-50 transition-colors`}>
           <CardHeader className="py-3 pb-1">
             <CardTitle className={`text-sm font-semibold ${stats.otsSinAsignar > 0 ? "text-indigo-800" : "text-slate-800"} flex items-center uppercase tracking-wider`}>
               <Wrench className="h-4 w-4 mr-2" />
               OTs Sin Asignar
             </CardTitle>
           </CardHeader>
           <CardContent className="pb-3 text-sm text-slate-600">
             <span className={`font-bold text-lg mr-1 ${stats.otsSinAsignar > 0 ? "text-indigo-700" : "text-slate-700"}`}>{stats.otsSinAsignar}</span> OTs <span className="opacity-80">esperando mecánico.</span>
           </CardContent>
         </Card>
         
         <Card className="col-span-1 border-l-4 border-l-red-500 shadow-sm bg-white hover:bg-slate-50 transition-colors">
           <CardHeader className="py-3 pb-1">
             <CardTitle className="text-sm font-semibold text-red-800 flex items-center uppercase tracking-wider">
               <Clock className="h-4 w-4 mr-2" />
               Garantías
             </CardTitle>
           </CardHeader>
           <CardContent className="pb-3 text-sm text-slate-600">
             <span className="font-bold text-red-700 text-lg mr-1">3</span> Garantías <span className="opacity-80">por vencer.</span>
           </CardContent>
         </Card>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-xl border-slate-200 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">OTs Activas</CardTitle>
            <Wrench className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats.otsAbiertas}</div>
            <p className="text-xs text-emerald-600 mt-1 font-medium flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" /> +14% mes actual
            </p>
          </CardContent>
        </Card>

        {canViewFinances ? (
          <>
            <Card className="rounded-xl border-slate-200 shadow-sm bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Ingresos Mes</CardTitle>
                <CircleDollarSign className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">${stats.ingresosMes.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
                <p className="text-xs text-emerald-600 mt-1 font-medium flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" /> +8% vs mes
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-xl border-slate-200 shadow-sm bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Por Cobrar</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">${(stats.cobrosPendientesDirectos + stats.cobrosPendientesSeguros).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Directo + Aseguradora
                </p>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card className="rounded-xl border-slate-200 shadow-sm bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">OTs por Asignar</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{stats.otsSinAsignar}</div>
                <p className="text-xs text-orange-600 mt-1 font-medium">Pendientes de revisión</p>
              </CardContent>
            </Card>

            <Card className="rounded-xl border-slate-200 shadow-sm bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Vehículos en Taller</CardTitle>
                <Car className="h-4 w-4 text-indigo-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{stats.vehiculosEnTaller}</div>
                <p className="text-xs text-slate-500 mt-1 font-medium">Capacidad normal</p>
              </CardContent>
            </Card>
          </>
        )}

        <Card className="rounded-xl border-slate-200 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Nuevos Clientes</CardTitle>
            <Users className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats.nuevosClientes}</div>
            <p className="text-xs text-red-600 mt-1 font-medium flex items-center">
              <TrendingDown className="h-3 w-3 mr-1" /> -5% vs mes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Ingresos vs Gastos (Semanal) */}
        {canViewFinances && (
          <Card className="col-span-1 md:col-span-2 lg:col-span-2 shadow-sm rounded-xl border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-800">Flujo de Caja Semanal</CardTitle>
              <CardDescription className="text-xs">Comparativa de ingresos facturados vs gastos de operación.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[260px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ingresosData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dx={-10} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}/>
                    <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorIngresos)" />
                    <Area type="monotone" dataKey="gastos" name="Gastos" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorGastos)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Distribución de Estados */}
        <Card className="col-span-1 shadow-sm rounded-xl border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-800">Estado Actual</CardTitle>
            <CardDescription className="text-xs">Distribución global de inventario.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-2">
            <div className="h-[200px] w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.otsAsignadasPorEstado}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {stats.otsAsignadasPorEstado.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                    itemStyle={{ color: '#1e293b', fontSize: '12px', fontWeight: '500' }}
                  />
                  <Legend iconType="circle" layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '11px', lineHeight: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Rendimiento Anual (Ingresos vs Completadas) */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-2 shadow-sm rounded-xl border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-800">Rendimiento Operativo</CardTitle>
            <CardDescription className="text-xs">Órdenes recibidas vs completadas (Semestral).</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rendimientoSemanal} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dx={-10} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '15px', fontSize: '12px' }}/>
                  <Bar dataKey="ots" name="OTs Recibidas" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="completadas" name="OTs Completadas" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Productividad Tecnicos */}
        <Card className="col-span-1 shadow-sm rounded-xl border-slate-200 overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-3 p-4">
            <CardTitle className="text-base font-semibold text-slate-800 flex items-center">
              <Users className="h-4 w-4 mr-2 text-indigo-500" />
              Rendimiento del Equipo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto h-[252px] overflow-y-auto">
              <table className="w-full text-sm text-left min-w-[320px]">
                <thead className="bg-white text-slate-500 font-medium border-b border-slate-100 text-xs uppercase tracking-wider sticky top-0">
                  <tr>
                    <th className="px-4 py-3">Técnico</th>
                    <th className="px-4 py-3 text-center">Eficiencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {stats.rendimientoTecnicos.map((t, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-700">
                        {t.nombre}
                        <div className="text-xs text-slate-400 font-normal mt-0.5">{t.completadas} / {t.asignadas} OTs terminadas</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2 text-right">
                          <div className="flex-1 max-w-[80px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${t.completadas/t.asignadas > 0.7 ? 'bg-emerald-500' : 'bg-orange-500'}`}
                              style={{width: `${Math.round((t.completadas / (t.asignadas||1)) * 100)}%`}}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-500 w-8">
                            {Math.round((t.completadas / (t.asignadas||1)) * 100)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {stats.rendimientoTecnicos.length === 0 && (
                     <tr>
                       <td colSpan={2} className="px-4 py-8 text-center text-slate-500 text-xs">
                         No hay datos de rendimiento.
                       </td>
                     </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
