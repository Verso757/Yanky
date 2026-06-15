import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, CheckCircle2, ShieldCheck, Search, ShieldX, CalendarDays, ExternalLink } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import axios from "@/src/lib/api";
import { format, differenceInDays } from "date-fns";

export default function Garantias() {
  const [garantias, setGarantias] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    axios.get("/api/garantias").then((res) => {
      if (Array.isArray(res.data)) {
        setGarantias(res.data);
      }
    }).catch(console.error);
  }, []);

  const metricas = {
    activas: 0,
    criticas: 0,
    expiradas: 0
  };

  const processedGarantias = garantias.map(g => {
    const venceEn = differenceInDays(new Date(g.fechaVencimiento), new Date());
    const isVencida = venceEn < 0;
    const isCritica = !isVencida && venceEn <= 30;

    if (isVencida) metricas.expiradas++;
    else if (isCritica) metricas.criticas++;
    else metricas.activas++;

    return { ...g, venceEn, isVencida, isCritica };
  });

  const filteredGarantias = processedGarantias.filter(g => {
    const term = searchTerm.toLowerCase();
    const cliente = g.ordenTrabajo?.cliente?.nombre?.toLowerCase() || "";
    const vehiculo = `${g.ordenTrabajo?.vehiculo?.marca} ${g.ordenTrabajo?.vehiculo?.placas}`.toLowerCase();
    const folio = g.ordenTrabajo?.folio?.toLowerCase() || "";
    
    return cliente.includes(term) || vehiculo.includes(term) || folio.includes(term);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Garantías y Entregas</h1>
          <p className="text-sm text-slate-500">Monitor de vencimientos, coberturas y post-venta</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-emerald-100 bg-emerald-50/10 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800">Garantías Activas</CardTitle>
            <div className="p-2 bg-emerald-100 rounded-full">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">{metricas.activas}</div>
            <p className="text-xs text-emerald-600/80 mt-1">Órdenes cubiertas actualmente</p>
          </CardContent>
        </Card>

        <Card className="border-orange-100 bg-orange-50/10 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Por Vencer (30 días)</CardTitle>
            <div className="p-2 bg-orange-100 rounded-full">
              <ShieldAlert className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">{metricas.criticas}</div>
            <p className="text-xs text-orange-600/80 mt-1">Seguimiento sugerido</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Expiradas</CardTitle>
            <div className="p-2 bg-slate-100 rounded-full">
              <ShieldX className="h-4 w-4 text-slate-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-700">{metricas.expiradas}</div>
            <p className="text-xs text-slate-500 mt-1">Registros históricos sin vigencia</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-slate-200">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-xl">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar por placa, cliente o folio OT..." 
              className="pl-9 bg-white border-slate-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="w-[120px]">OT</TableHead>
                <TableHead>Cliente / Vehículo</TableHead>
                <TableHead>Vigencia</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGarantias.map((g) => {
                return (
                  <TableRow key={g.id} className="hover:bg-slate-50/50">
                    <TableCell>
                      <Link to={`/ordenes/${g.ordenTrabajoId}`} className="font-bold text-indigo-600 hover:underline">
                        {g.ordenTrabajo?.folio || "---"}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900">{g.ordenTrabajo?.cliente?.nombre}</span>
                        <span className="text-xs text-slate-500">{g.ordenTrabajo?.vehiculo?.marca} • Placas: {g.ordenTrabajo?.vehiculo?.placas}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                          <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                          {g.fechaVencimiento ? format(new Date(g.fechaVencimiento), "dd MMM yyyy") : "--"}
                        </span>
                        <span className="text-xs text-slate-400 mt-0.5">Creada: {format(new Date(g.createdAt), "dd MMM yyyy")}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {g.isVencida ? (
                         <Badge variant="outline" className="bg-slate-100 text-slate-600 border-transparent shadow-none">
                           <ShieldX className="w-3 h-3 mr-1" /> Expirada
                         </Badge>
                      ) : g.isCritica ? (
                         <Badge variant="outline" className="bg-orange-100 text-orange-800 border-transparent flex items-center w-fit shadow-none">
                           <ShieldAlert className="w-3 h-3 mr-1" /> Vence en {g.venceEn} d
                         </Badge>
                      ) : (
                         <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-transparent flex items-center w-fit shadow-none">
                           <CheckCircle2 className="w-3 h-3 mr-1" /> {g.venceEn} días rest.
                         </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                       <Link to={`/ordenes/${g.ordenTrabajoId}`}>
                         <Button variant="ghost" size="sm" className="h-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                           <ExternalLink className="w-4 h-4 mr-2" /> Detalle OT
                         </Button>
                       </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredGarantias.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-slate-500">
                    <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="font-medium">No se encontraron garantías</p>
                    <p className="text-sm">Prueba ajustando los filtros de búsqueda.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
