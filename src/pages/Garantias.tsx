import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, CheckCircle2 } from "lucide-react";
import axios from "@/src/lib/api";
import { format, differenceInDays } from "date-fns";

export default function Garantias() {
  const [garantias, setGarantias] = useState<any[]>([]);

  useEffect(() => {
    axios.get("/api/garantias").then((res) => {
      if (Array.isArray(res.data)) {
        setGarantias(res.data);
      }
    }).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Garantías Activas</h1>
          <p className="text-sm text-slate-500">Monitor de vencimientos de trabajos entregados</p>
        </div>
      </div>

      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>OT</TableHead>
              <TableHead>Cliente / Vehículo</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {garantias.map((g) => {
              const venceEn = differenceInDays(new Date(g.fechaVencimiento), new Date());
              const isVencida = venceEn < 0;
              const isCritica = !isVencida && venceEn <= 30;

              return (
                <TableRow key={g.id}>
                  <TableCell className="font-medium text-slate-900">{g.ordenTrabajo.folio}</TableCell>
                  <TableCell>
                    <p className="text-sm text-slate-900">{g.ordenTrabajo.cliente.nombre}</p>
                    <p className="text-xs text-slate-500">{g.ordenTrabajo.vehiculo.marca} {g.ordenTrabajo.vehiculo.placas}</p>
                  </TableCell>
                  <TableCell>{g.tipo}</TableCell>
                  <TableCell className="text-slate-500">{format(new Date(g.fechaVencimiento), "dd/MM/yyyy")}</TableCell>
                  <TableCell>
                    {isVencida ? (
                       <Badge variant="outline" className="bg-slate-100 text-slate-600 border-transparent">
                         Expirada
                       </Badge>
                    ) : isCritica ? (
                       <Badge variant="outline" className="bg-orange-100 text-orange-800 border-transparent flex items-center w-fit">
                         <ShieldAlert className="w-3 h-3 mr-1" /> Vence en {venceEn} días
                       </Badge>
                    ) : (
                       <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-transparent flex items-center w-fit">
                         <CheckCircle2 className="w-3 h-3 mr-1" /> Activa
                       </Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {garantias.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                  No hay garantías registradas en el sistema.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
