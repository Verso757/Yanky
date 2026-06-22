import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Settings, ArrowRight, Calendar, LayoutGrid, List } from "lucide-react";
import axios from "@/src/lib/api";
import { format } from "date-fns";
import { motion } from "motion/react";

export default function OrdenesList() {
  const [ordenes, setOrdenes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "board">("list");

  useEffect(() => {
    fetchOrdenes();
  }, []);

  const fetchOrdenes = () => {
    axios.get("/api/ordenes").then((res) => {
      if (Array.isArray(res.data)) {
        setOrdenes(res.data);
      }
    }).catch(console.error);
  };

  const updateEstado = async (id: string, nuevoEstado: string) => {
    try {
      await axios.patch(`/api/ordenes/${id}/estado`, { estado: nuevoEstado });
      fetchOrdenes();
    } catch(e) {
      console.error(e);
      alert("Error al actualizar estado");
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case "INGRESADO": return "bg-blue-100 text-blue-800 border-blue-200";
      case "EN_DIAGNOSTICO": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "EN_PROCESO": return "bg-purple-100 text-purple-800 border-purple-200";
      case "LISTO": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "ENTREGADO": return "bg-slate-200 text-slate-800 border-slate-300";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const filteredOrdenes = ordenes.filter((ot) => {
    const term = searchTerm.toLowerCase();
    return (
      (ot.folio || "").toLowerCase().includes(term) ||
      (ot.cliente?.nombre || "").toLowerCase().includes(term) ||
      (ot.vehiculo?.placas || "").toLowerCase().includes(term)
    );
  });

  const boardColumns = [
    { title: "Ingresado", estado: "INGRESADO", color: "border-blue-300 bg-blue-50/50" },
    { title: "En Diagnóstico", estado: "EN_DIAGNOSTICO", color: "border-yellow-300 bg-yellow-50/50" },
    { title: "En Proceso", estado: "EN_PROCESO", color: "border-purple-300 bg-purple-50/50" },
    { title: "Listo", estado: "LISTO", color: "border-emerald-300 bg-emerald-50/50" }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6 flex flex-col h-[calc(100vh-8rem)]" // Fill available height
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 md:p-6 rounded-lg border border-slate-200 shadow-sm shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 flex items-center">
            <Settings className="w-6 h-6 md:w-8 md:h-8 mr-3 text-indigo-600" />
            Órdenes de Trabajo
          </h1>
          <p className="text-sm text-slate-500 mt-1">Gestiona los ingresos, reparaciones y vehículos en el taller</p>
        </div>
        <Link to="/ordenes/nueva">
          <Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Orden
          </Button>
        </Link>
      </div>

      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-4 shrink-0">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            type="search" 
            placeholder="Buscar por folio, cliente, vehículo o placas..." 
            className="pl-10 bg-slate-50 border-slate-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex bg-slate-100 p-1 rounded-md shrink-0">
          <Button 
            variant={viewMode === "list" ? "secondary" : "ghost"} 
            size="sm" 
            className={`px-3 ${viewMode === "list" ? "bg-white shadow-sm" : "hover:bg-slate-200"}`}
            onClick={() => setViewMode("list")}
          >
            <List className="w-4 h-4 mr-2" /> Lista
          </Button>
          <Button 
            variant={viewMode === "board" ? "secondary" : "ghost"} 
            size="sm" 
            className={`px-3 ${viewMode === "board" ? "bg-white shadow-sm" : "hover:bg-slate-200"}`}
            onClick={() => setViewMode("board")}
          >
            <LayoutGrid className="w-4 h-4 mr-2" /> Tablero
          </Button>
        </div>
      </div>

      {viewMode === "list" ? (
        <div className="flex-1 overflow-auto space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead className="w-[120px]">Folio / Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Vehículo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Técnico</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrdenes.map((ot) => (
                  <TableRow key={ot.id} className="hover:bg-slate-50/50 transition-colors group">
                    <TableCell>
                      <div className="font-semibold text-slate-900">{ot.folio}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{ot.createdAt ? format(new Date(ot.createdAt), "dd/MM/yy HH:mm") : "--"}</div>
                      {ot.origen === "SEGURO_FLUJO_B" && <Badge variant="secondary" className="mt-1 bg-indigo-50 text-indigo-700 text-[10px]">COTIZACIÓN</Badge>}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-900">{ot.cliente?.nombre}</div>
                      <div className="text-xs text-slate-500">{ot.cliente?.telefono}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-900">{ot.vehiculo?.marca} {ot.vehiculo?.modelo}</div>
                      <div className="text-xs mt-1">
                        <Badge variant="outline" className="font-mono bg-white text-slate-600 border-slate-200">{ot.vehiculo?.placas}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`${getStatusColor(ot.estado)} font-medium border`}>
                        {ot.estado?.replace("_", " ")}
                      </Badge>
                      <div className="text-xs mt-2 space-y-0.5">
                        <div className="text-slate-500">Monto: <span className="font-medium text-slate-700">${ot.montoCotizado?.toFixed(2) || "0.00"}</span></div>
                        <div className="text-slate-500">Saldo: <span className="font-medium text-red-600">${((ot.montoCotizado || 0) - (ot.montoCobrado || 0))?.toFixed(2) || "0.00"}</span></div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {ot.nombreMecanicoAsignado ? (
                        <div className="text-sm font-medium text-indigo-700">{ot.nombreMecanicoAsignado}</div>
                      ) : (
                        <div className="text-xs text-slate-400 italic">Sin asignar</div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link to={`/ordenes/${ot.id}`}>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                          Ver detalles <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredOrdenes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <Settings className="h-8 w-8 text-slate-300 mb-2" />
                        <p>No se encontraron órdenes de trabajo.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredOrdenes.map((ot) => (
              <div key={ot.id} className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-slate-900 text-lg flex items-center gap-2">
                      {ot.folio}
                      {ot.origen === "SEGURO_FLUJO_B" && <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 text-[10px]">COTIZACIÓN</Badge>}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center mt-1">
                      <Calendar className="w-3 h-3 mr-1" />
                      {ot.createdAt ? format(new Date(ot.createdAt), "dd/MM/yyyy HH:mm") : "--"}
                    </div>
                  </div>
                  <Badge variant="secondary" className={`${getStatusColor(ot.estado)} border font-medium`}>
                    {ot.estado.replace("_", " ")}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm border-t border-slate-100 py-3 mt-1">
                  <div>
                    <span className="text-xs text-slate-500 block mb-0.5">Cliente</span>
                    <span className="font-medium text-slate-800">{ot.cliente?.nombre}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block mb-0.5">Vehículo</span>
                    <span className="font-medium text-slate-800 line-clamp-1">{ot.vehiculo?.marca} {ot.vehiculo?.modelo}</span>
                    <Badge variant="outline" className="font-mono mt-1 text-[10px] px-1 py-0 h-4">{ot.vehiculo?.placas}</Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between border-y border-slate-100 py-3 mb-2">
                  <div>
                    <div className="text-xs text-slate-500 block mb-0.5">Técnico</div>
                    <div className="font-medium text-slate-800">{ot.nombreMecanicoAsignado || <span className="text-slate-400 italic">Sin asignar</span>}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Saldo Pendiente</div>
                    <div className="font-bold text-red-600">${((ot.montoCotizado || 0) - (ot.montoCobrado || 0))?.toFixed(2) || "0.00"}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-500">Monto Total</div>
                    <div className="font-bold text-slate-900">${ot.montoCotizado?.toFixed(2) || "0.00"}</div>
                  </div>
                  <Link to={`/ordenes/${ot.id}`} className="flex-1 ml-4">
                    <Button variant="outline" className="w-full text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                      Gestionar OT
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Board View */
        <div className="flex-1 overflow-x-auto overflow-y-hidden pt-2 pb-6 min-h-[400px]">
          <div className="flex gap-4 h-full min-w-max">
            {boardColumns.map((col) => {
              const columnOrdenes = filteredOrdenes.filter(o => o.estado === col.estado);
              return (
                <div key={col.estado} className={`w-80 rounded-xl border-2 flex flex-col ${col.color} bg-opacity-40`}>
                  <div className="p-3 border-b border-inherit shrink-0 font-semibold text-slate-800 flex justify-between items-center bg-white/40 rounded-t-xl">
                    {col.title}
                    <Badge variant="secondary" className="bg-white/60">{columnOrdenes.length}</Badge>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {columnOrdenes.map((ot) => (
                      <div key={ot.id} className="bg-white rounded-lg p-3 shadow-sm border border-slate-200 hover:shadow-md transition-shadow group">
                        <div className="flex justify-between items-start mb-2">
                          <Link to={`/ordenes/${ot.id}`} className="font-bold text-indigo-700 hover:underline">{ot.folio}</Link>
                          {ot.nombreMecanicoAsignado ? (
                            <div className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-medium truncate max-w-[100px]">{ot.nombreMecanicoAsignado}</div>
                          ) : (
                            <div className="text-[10px] px-1.5 py-0.5 bg-red-50 text-red-600 rounded font-medium border border-red-100">Sin Técnico</div>
                          )}
                        </div>
                        <div className="text-sm font-medium text-slate-800 line-clamp-1">{ot.cliente?.nombre}</div>
                        <div className="text-xs text-slate-500 mb-2">{ot.vehiculo?.marca} {ot.vehiculo?.modelo} - <span className="font-mono">{ot.vehiculo?.placas}</span></div>
                        
                        <div className="flex gap-1 mt-3 pt-2 border-t border-slate-100">
                          {col.estado === "INGRESADO" && (
                            <Button size="sm" variant="ghost" className="h-7 text-xs w-full bg-slate-50 hover:bg-yellow-50 hover:text-yellow-700 border border-slate-200" onClick={() => updateEstado(ot.id, "EN_DIAGNOSTICO")}>
                              Pasar a Diagnóstico &rarr;
                            </Button>
                          )}
                          {col.estado === "EN_DIAGNOSTICO" && (
                            <>
                              <Button size="sm" variant="ghost" className="h-7 text-xs w-full bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200" onClick={() => updateEstado(ot.id, "INGRESADO")}>&larr;</Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs w-full bg-slate-50 hover:bg-purple-50 hover:text-purple-700 border border-slate-200" onClick={() => updateEstado(ot.id, "EN_PROCESO")}>A Proceso &rarr;</Button>
                            </>
                          )}
                          {col.estado === "EN_PROCESO" && (
                            <>
                              <Button size="sm" variant="ghost" className="h-7 text-xs w-full bg-slate-50 hover:bg-yellow-50 hover:text-yellow-700 border border-slate-200" onClick={() => updateEstado(ot.id, "EN_DIAGNOSTICO")}>&larr;</Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs w-full bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200" onClick={() => updateEstado(ot.id, "LISTO")}>A Listo &rarr;</Button>
                            </>
                          )}
                          {col.estado === "LISTO" && (
                            <Button size="sm" variant="ghost" className="h-7 text-xs w-full bg-slate-50 hover:bg-purple-50 hover:text-purple-700 border border-slate-200" onClick={() => updateEstado(ot.id, "EN_PROCESO")}>
                              &larr; Regresar
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
