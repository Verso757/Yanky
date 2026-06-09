import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DollarSign, Plus, ArrowDown, ArrowUp, FileText } from "lucide-react";
import axios from "axios";
import { format } from "date-fns";

export default function Finanzas() {
  const [gastos, setGastos] = useState<any[]>([]);
  const [ingresosTotales, setIngresosTotales] = useState(0);

  useEffect(() => {
    // Gastos
    axios.get("/api/gastos").then((res) => {
      if (Array.isArray(res.data)) {
        setGastos(res.data);
      }
    }).catch(console.error);

    // Ingresos estimación (montos cobrados en OTs)
    axios.get("/api/ordenes").then((res) => {
      if (Array.isArray(res.data)) {
        const ingresos = res.data.reduce((acc: number, o: any) => acc + (o.montoCobrado || 0), 0);
        setIngresosTotales(ingresos);
      }
    }).catch(console.error);
  }, []);

  const totalGastos = gastos.reduce((acc: number, g: any) => acc + g.monto, 0);
  const balance = ingresosTotales - totalGastos;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Finanzas</h1>
          <p className="text-sm text-slate-500">Control de ingresos y gastos del taller</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Registrar Gasto
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales (Cobros)</CardTitle>
            <ArrowUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">${ingresosTotales.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos Registrados</CardTitle>
            <ArrowDown className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">${totalGastos.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">${balance.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Gastos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Concepto</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Método</TableHead>
                <TableHead className="text-right">Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gastos.map((g) => (
                <TableRow key={g.id}>
                  <TableCell>{format(new Date(g.fecha), "dd/MM/yyyy")}</TableCell>
                  <TableCell>{g.descripcion}</TableCell>
                  <TableCell>{g.categoria}</TableCell>
                  <TableCell>{g.metodoPago}</TableCell>
                  <TableCell className="text-right font-medium text-orange-600">-${g.monto.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              {gastos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-slate-500">
                    No hay gastos registrados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
