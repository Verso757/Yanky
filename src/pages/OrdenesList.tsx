import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import axios from "@/src/lib/api";
import { format } from "date-fns";

export default function OrdenesList() {
  const [ordenes, setOrdenes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    axios.get("/api/ordenes").then((res) => {
      if (Array.isArray(res.data)) {
        setOrdenes(res.data);
      }
    }).catch(console.error);
  }, []);

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case "INGRESADO": return "bg-blue-100 text-blue-800";
      case "EN_DIAGNOSTICO": return "bg-yellow-100 text-yellow-800";
      case "EN_PROCESO": return "bg-purple-100 text-purple-800";
      case "LISTO": return "bg-emerald-100 text-emerald-800";
      case "ENTREGADO": return "bg-slate-200 text-slate-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  const filteredOrdenes = ordenes.filter((ot) => {
    const term = searchTerm.toLowerCase();
    return (
      ot.folio.toLowerCase().includes(term) ||
      ot.cliente.nombre.toLowerCase().includes(term) ||
      ot.vehiculo.placas.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Órdenes de Trabajo</h1>
          <p className="text-sm text-slate-500">Gestiona los ingresos y vehículos en el taller</p>
        </div>
        <Link to="/ordenes/nueva">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Orden
          </Button>
        </Link>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input 
            type="search" 
            placeholder="Buscar por folio, cliente o placas..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Folio</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Vehículo</TableHead>
              <TableHead>Ingreso</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrdenes.map((ot) => (
              <TableRow key={ot.id} className="hover:bg-slate-50 transition-colors">
                <TableCell className="font-medium text-slate-900">{ot.folio}</TableCell>
                <TableCell>{ot.cliente.nombre}</TableCell>
                <TableCell>{ot.vehiculo.marca} {ot.vehiculo.modelo} <span className="ml-1 px-1.5 py-0.5 rounded border bg-slate-100 text-xs font-mono">{ot.vehiculo.placas}</span></TableCell>
                <TableCell className="text-slate-500">{format(new Date(ot.fechaIngreso), "dd/MM/yyyy")}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={`${getStatusColor(ot.estado)} hover:${getStatusColor(ot.estado)} border-transparent`}>
                    {ot.estado.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Link to={`/ordenes/${ot.id}`}>
                    <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">Ver detalles</Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
            {filteredOrdenes.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                  No se encontraron órdenes.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
