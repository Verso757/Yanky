import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Car, User, Phone, Mail } from "lucide-react";
import axios from "@/src/lib/api";

export default function Clientes() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    axios.get("/api/clientes").then((res) => {
      if (Array.isArray(res.data)) {
        setClientes(res.data);
      }
    }).catch(console.error);
  }, []);

  const filteredClientes = clientes.filter((c) => {
    const term = searchTerm.toLowerCase();
    const vehiculosMatch = c.vehiculos?.some((v: any) => 
      v.placas.toLowerCase().includes(term) || 
      v.marca.toLowerCase().includes(term) ||
      v.modelo.toLowerCase().includes(term)
    );
    return (
      c.nombre.toLowerCase().includes(term) ||
      (c.telefono && c.telefono.includes(term)) ||
      vehiculosMatch
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Directorio de Clientes</h1>
          <p className="text-sm text-slate-500">Administra los clientes y sus vehículos registrados</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Cliente
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input 
            type="search" 
            placeholder="Buscar por nombre, tel o placas..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredClientes.map((cliente) => (
          <div key={cliente.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm flex flex-col md:flex-row">
            {/* Detalles del Cliente */}
            <div className="p-6 flex-1 md:border-r border-slate-100">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-slate-400" />
                    <h3 className="text-lg font-semibold text-slate-900">{cliente.nombre}</h3>
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                      {cliente.tipo}
                    </Badge>
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-slate-600">
                    {cliente.telefono && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2" />
                        {cliente.telefono}
                      </div>
                    )}
                    {cliente.email && (
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2" />
                        {cliente.email}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                   <Button variant="outline" size="sm">Editar</Button>
                </div>
              </div>
            </div>

            {/* Vehículos del Cliente */}
            <div className="p-6 flex-1 bg-slate-50/50">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-slate-900 flex items-center">
                  <Car className="h-4 w-4 mr-2 text-slate-500" />
                  Vehículos Registrados ({cliente.vehiculos?.length || 0})
                </h4>
                <Button variant="ghost" size="sm" className="h-8 text-slate-600">
                  <Plus className="h-3 w-3 mr-1" /> Agregar
                </Button>
              </div>
              
              {cliente.vehiculos && cliente.vehiculos.length > 0 ? (
                <div className="space-y-3">
                  {cliente.vehiculos.map((v: any) => (
                    <div key={v.id} className="flex items-center justify-between bg-white px-3 py-2 rounded border border-slate-200 shadow-sm">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{v.marca} {v.modelo} <span className="text-slate-500">({v.anio})</span></p>
                        <p className="text-xs text-slate-500">Color: {v.color}</p>
                      </div>
                      <Badge variant="outline" className="font-mono bg-slate-50">{v.placas}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">No hay vehículos registrados.</p>
              )}
            </div>
          </div>
        ))}
        {filteredClientes.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
            <User className="h-8 w-8 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No se encontraron clientes coincidiendo con tu búsqueda.</p>
          </div>
        )}
      </div>
    </div>
  );
}
