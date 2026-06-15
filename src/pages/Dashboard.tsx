import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Wrench, CircleDollarSign, Car, AlertTriangle, Clock, TrendingUp, TrendingDown, Users, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import axios from "@/src/lib/api";
import { useAuth } from "@/src/context/AuthContext";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function Dashboard() {
  const { user } = useAuth();
  const canViewFinances = ["ADMIN", "JEFE"].includes(user?.rol || "");
  const isRecepcion = user?.rol === "RECEPCIONISTA";

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
  const [ingresosData, setIngresosData] = useState([
    { name: 'Lun', ingresos: 4000, gastos: 2400 },
    { name: 'Mar', ingresos: 3000, gastos: 1398 },
    { name: 'Mié', ingresos: 2000, gastos: 9800 },
    { name: 'Jue', ingresos: 2780, gastos: 3908 },
    { name: 'Vie', ingresos: 1890, gastos: 4800 },
    { name: 'Sáb', ingresos: 2390, gastos: 3800 },
    { name: 'Dom', ingresos: 3490, gastos: 4300 },
  ]);

  const [rendimientoSemanal, setRendimientoSemanal] = useState([
    { name: 'Ene', ots: 65, completadas: 40 },
    { name: 'Feb', ots: 59, completadas: 30 },
    { name: 'Mar', ots: 80, completadas: 60 },
    { name: 'Abr', ots: 81, completadas: 75 },
    { name: 'May', ots: 56, completadas: 45 },
    { name: 'Jun', ots: 55, completadas: 40 },
  ]);

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
        
        // Si no hay datos, ponemos unos fakes para la demo
        if (otsAsignadasPorEstado.length === 0) {
           otsAsignadasPorEstado.push(
             { name: 'INGRESADO', value: 5 },
             { name: 'EN_PROCESO', value: 12 },
             { name: 'LISTO', value: 3 },
             { name: 'ENTREGADO', value: 8 }
           );
        }

        setStats({
          otsAbiertas: abiertas.length > 0 ? abiertas.length : 15, // fake data si 0
          ingresosMes: ots.reduce((acc: number, o: any) => acc + (o.montoCobrado || 0), 0) || 45000,
          cobrosPendientesDirectos: ots
            .filter((o: any) => o.quienPaga === "CLIENTE")
            .reduce((acc: number, o: any) => acc + ((o.montoCotizado || 0) - (o.montoCobrado || 0)), 0) || 12000,
          cobrosPendientesSeguros: ots
            .filter((o: any) => o.quienPaga === "ASEGURADORA")
            .reduce((acc: number, o: any) => acc + ((o.montoCotizado || 0) - (o.montoCobrado || 0)), 0) || 28000,
          vehiculosEnTaller: abiertas.length + ots.filter((o: any) => o.estado === "LISTO").length || 18,
          nuevosClientes: 12,
          otsAsignadasPorEstado,
          otsSinAsignar: sinAsignar.length || 3,
          entregasProximas: porEntregar.length || 2
        });
      }
    }).catch(console.error);
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard General</h1>
          <p className="text-slate-500 mt-1">Resumen de operaciones {canViewFinances ? "y finanzas " : ""}del taller.</p>
        </div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">OTs Activas</CardTitle>
            <div className="p-2 bg-blue-50 rounded-md">
              <Wrench className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats.otsAbiertas}</div>
            <p className="text-xs text-blue-600 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +14% vs mes anterior
            </p>
          </CardContent>
        </Card>

        {canViewFinances ? (
          <>
            <Card className="border-l-4 border-l-emerald-500 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Ingresos Mensuales</CardTitle>
                <div className="p-2 bg-emerald-50 rounded-md">
                  <CircleDollarSign className="h-4 w-4 text-emerald-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">${stats.ingresosMes.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
                <p className="text-xs text-emerald-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +8% vs mes anterior
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Por Cobrar (Total)</CardTitle>
                <div className="p-2 bg-orange-50 rounded-md">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">${(stats.cobrosPendientesDirectos + stats.cobrosPendientesSeguros).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
                <p className="text-xs text-orange-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +2% de atraso
                </p>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card className="border-l-4 border-l-orange-500 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">OTs por Asignar</CardTitle>
                <div className="p-2 bg-orange-50 rounded-md">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{stats.otsSinAsignar}</div>
                <p className="text-xs text-orange-600 flex items-center mt-1">
                  Pendientes de revisión
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-emerald-500 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Vehículos en Taller</CardTitle>
                <div className="p-2 bg-emerald-50 rounded-md">
                  <Car className="h-4 w-4 text-emerald-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{stats.vehiculosEnTaller}</div>
                <p className="text-xs text-emerald-600 flex items-center mt-1">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Capacidad normal
                </p>
              </CardContent>
            </Card>
          </>
        )}

        <Card className="border-l-4 border-l-indigo-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Nuevos Clientes</CardTitle>
            <div className="p-2 bg-indigo-50 rounded-md">
              <Users className="h-4 w-4 text-indigo-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats.nuevosClientes}</div>
            <p className="text-xs text-red-500 flex items-center mt-1">
              <TrendingDown className="h-3 w-3 mr-1" />
              -5% vs mes anterior
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Ingresos vs Gastos (Semanal) */}
        {canViewFinances && (
          <Card className="col-span-1 lg:col-span-2 shadow-sm">
            <CardHeader>
              <CardTitle>Flujo de Caja Semanal</CardTitle>
              <CardDescription>Comparativa de ingresos facturados vs gastos de operación.</CardDescription>
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
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dx={-10} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }}/>
                    <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#10b981" fillOpacity={1} fill="url(#colorIngresos)" />
                    <Area type="monotone" dataKey="gastos" name="Gastos" stroke="#f43f5e" fillOpacity={1} fill="url(#colorGastos)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rendimiento Anual (Ingresos vs Completadas) - Visible for all, but takes full width if finances hidden */}
        <Card className={`shadow-sm ${canViewFinances ? 'col-span-1 lg:col-span-3' : 'col-span-1 lg:col-span-2'}`}>
          <CardHeader>
            <CardTitle>Rendimiento Operativo (Semestral)</CardTitle>
            <CardDescription>Relación entre órdenes de trabajo creadas y completadas.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rendimientoSemanal} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dx={-10} />
                  <Tooltip 
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }}/>
                  <Bar dataKey="ots" name="OTs Recibidas" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  <Bar dataKey="completadas" name="OTs Completadas" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Distribución de Estados */}
        <Card className="col-span-1 shadow-sm">
          <CardHeader>
            <CardTitle>Estado del Taller</CardTitle>
            <CardDescription>Distribución de órdenes por estado actual.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.otsAsignadasPorEstado}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.otsAsignadasPorEstado.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#1e293b' }}
                  />
                  <Legend iconType="circle" layout="horizontal" verticalAlign="bottom" />
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
    </div>
  );
}
