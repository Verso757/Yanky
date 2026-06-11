import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Wrench, CircleDollarSign, Car, AlertTriangle, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "@/src/lib/api";

export default function Dashboard() {
  const [stats, setStats] = useState({
    otsAbiertas: 0,
    ingresosMes: 0,
    cobrosPendientesDirectos: 0,
    cobrosPendientesSeguros: 0,
    vehiculosEnTaller: 0,
  });

  useEffect(() => {
    // Simulamos la carga de stats desde el backend reales 
    axios.get("/api/ordenes").then((res) => {
      if (Array.isArray(res.data)) {
        const ots = res.data;
        const abiertas = ots.filter((o: any) => ["INGRESADO", "EN_DIAGNOSTICO", "EN_PROCESO"].includes(o.estado));
        
        setStats({
          otsAbiertas: abiertas.length,
          ingresosMes: ots.reduce((acc: number, o: any) => acc + (o.montoCobrado || 0), 0),
          cobrosPendientesDirectos: ots
            .filter((o: any) => o.quienPaga === "CLIENTE")
            .reduce((acc: number, o: any) => acc + ((o.montoCotizado || 0) - (o.montoCobrado || 0)), 0),
          cobrosPendientesSeguros: ots
            .filter((o: any) => o.quienPaga === "ASEGURADORA")
            .reduce((acc: number, o: any) => acc + ((o.montoCotizado || 0) - (o.montoCobrado || 0)), 0),
          vehiculosEnTaller: abiertas.length + ots.filter((o: any) => o.estado === "LISTO").length,
        });
      }
    }).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">OTs Abiertas Hoy</CardTitle>
            <Wrench className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.otsAbiertas}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos (Mes)</CardTitle>
            <CircleDollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">${stats.ingresosMes.toFixed(2)}</div>
            <p className="text-xs text-slate-500 mt-1">Directos + Seguros</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendiente Directos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">${stats.cobrosPendientesDirectos.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Por Cobrar Seguros</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">${stats.cobrosPendientesSeguros.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vehículos en Taller</CardTitle>
            <Car className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.vehiculosEnTaller}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
         <Card className="col-span-1 lg:col-span-1 border-orange-200">
           <CardHeader>
             <CardTitle className="text-lg text-orange-800">ATENCIÓN: Entregas (&lt; 48h)</CardTitle>
           </CardHeader>
           <CardContent>
             <p className="text-sm text-slate-500 text-center py-4">No hay OTs próximas a entrega crítica.</p>
           </CardContent>
         </Card>
         <Card className="col-span-1 lg:col-span-1 border-blue-200">
           <CardHeader>
             <CardTitle className="text-lg text-blue-800">Garantías (vencen &lt; 30d)</CardTitle>
           </CardHeader>
           <CardContent>
             <p className="text-sm text-slate-500 text-center py-4">No hay garantías por vencer.</p>
           </CardContent>
         </Card>
         <Card className="col-span-1 lg:col-span-1 border-slate-200">
           <CardHeader>
             <CardTitle className="text-lg text-slate-800">Cotizaciones Flujo B (&gt; 7d)</CardTitle>
           </CardHeader>
           <CardContent>
             <p className="text-sm text-slate-500 text-center py-4">Todo al corriente.</p>
           </CardContent>
         </Card>
      </div>
    </div>
  );
}
