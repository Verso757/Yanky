import { useEffect, useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Car, User, Phone, Mail, FileEdit, Camera, History, Calendar, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import axios from "@/src/lib/api";

function VehicleCard({ vehiculo, onPhotoUpdated }: { vehiculo: any, onPhotoUpdated: () => void }) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [ordenes, setOrdenes] = useState<any[]>([]);
  const [isLoadingOrdenes, setIsLoadingOrdenes] = useState(false);

  useEffect(() => {
    if (isDetailsOpen) {
      setIsLoadingOrdenes(true);
      axios.get(`/api/vehiculos/${vehiculo.id}/ordenes`)
        .then(res => setOrdenes(res.data))
        .catch(err => console.error("Error fetching orders:", err))
        .finally(() => setIsLoadingOrdenes(false));
    }
  }, [isDetailsOpen, vehiculo.id]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      await axios.put(`/api/vehiculos/${vehiculo.id}`, { ...vehiculo, fotoUrl: base64 });
      onPhotoUpdated();
    } catch (error) {
      alert("Error subiendo foto");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <div className="group bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all flex gap-4">
        {/* Thumbnail */}
        <div 
          className="w-20 h-20 bg-slate-100 rounded-md shrink-0 border border-slate-200 overflow-hidden flex items-center justify-center relative cursor-pointer hover:bg-slate-200 transition-colors"
          onClick={() => fileInputRef.current?.click()}
          title="Clic para cambiar foto"
        >
          {isUploading ? (
             <span className="text-xs text-slate-500 font-medium animate-pulse">Subiendo...</span>
          ) : vehiculo.fotoUrl ? (
             <img src={vehiculo.fotoUrl} alt={vehiculo.placas} className="w-full h-full object-cover" />
          ) : (
             <div className="flex flex-col items-center justify-center text-slate-400">
               <Camera className="w-6 h-6 mb-1 opacity-50" />
               <span className="text-[10px] leading-tight font-medium">Añadir foto</span>
             </div>
          )}
          <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} />
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center cursor-pointer" onClick={() => setIsDetailsOpen(true)}>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="font-mono bg-slate-50 text-[10px] sm:text-xs px-1.5 py-0 border-slate-300">{vehiculo.placas}</Badge>
            <span className="text-xs font-medium text-slate-400">{vehiculo.anio}</span>
          </div>
          <p className="font-bold text-slate-900 truncate group-hover:text-indigo-700 transition-colors" title={`${vehiculo.marca} ${vehiculo.modelo}`}>{vehiculo.marca} {vehiculo.modelo}</p>
          <p className="text-sm text-slate-500 capitalize truncate">{vehiculo.color}</p>
        </div>
      </div>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-md w-[95vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Car className="w-5 h-5 text-indigo-600" />
              Detalles del Vehículo
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-32 h-32 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden shrink-0">
                {vehiculo.fotoUrl ? (
                  <img src={vehiculo.fotoUrl} alt={vehiculo.placas} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <Camera className="w-10 h-10" />
                  </div>
                )}
              </div>
              <div className="space-y-4 flex-1">
                <div>
                  <p className="text-sm text-slate-500 font-medium">Marca y Modelo</p>
                  <p className="font-bold text-slate-900 text-lg">{vehiculo.marca} {vehiculo.modelo}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Año</p>
                  <p className="text-slate-900">{vehiculo.anio}</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="text-sm text-slate-500 font-medium mb-1">Placas / Matrícula</p>
                <Badge variant="outline" className="font-mono bg-white text-sm px-2">{vehiculo.placas}</Badge>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="text-sm text-slate-500 font-medium mb-1">Color</p>
                <p className="text-slate-900 capitalize font-medium">{vehiculo.color}</p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h4 className="text-sm font-semibold text-slate-700 flex items-center mb-3">
                <History className="w-4 h-4 mr-2 text-indigo-500" />
                Historial de Servicios
              </h4>
              
              {isLoadingOrdenes ? (
                <p className="text-sm text-slate-500 italic">Cargando historial...</p>
              ) : ordenes.length > 0 ? (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                  {ordenes.map(ot => (
                    <div key={ot.id} className="bg-white border text-left w-full border-slate-200 p-3 rounded-lg flex items-start gap-3">
                      <div className="bg-indigo-50 p-2 rounded-full shrink-0">
                        <FileText className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-medium text-slate-900 text-sm truncate">{ot.fallaReportada || "Servicio General"}</p>
                          <Badge variant="outline" className="text-[10px] ml-2 shrink-0">{ot.estado}</Badge>
                        </div>
                        <div className="flex items-center text-xs text-slate-500 gap-3">
                          <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {new Date(ot.createdAt).toLocaleDateString()}</span>
                          <span className="font-mono">#{ot.id.slice(-5).toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-slate-50 rounded-lg border border-slate-100 border-dashed">
                  <p className="text-sm text-slate-500">Este vehículo no tiene órdenes de trabajo previas.</p>
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => setIsDetailsOpen(false)} className="bg-indigo-600 hover:bg-indigo-700">Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function Clientes() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editClient, setEditClient] = useState<any>(null);

  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [targetClienteId, setTargetClienteId] = useState<string | null>(null);

  const fetchClientes = () => {
    axios.get("/api/clientes").then((res) => {
      if (Array.isArray(res.data)) {
        setClientes(res.data);
      }
    }).catch(console.error);
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const filteredClientes = clientes.filter((c) => {
    const term = searchTerm.toLowerCase();
    const vehiculosMatch = c.vehiculos?.some((v: any) => 
      v.placas?.toLowerCase().includes(term) || 
      v.marca?.toLowerCase().includes(term) ||
      v.modelo?.toLowerCase().includes(term)
    );
    return (
      c.nombre?.toLowerCase().includes(term) ||
      (c.telefono && c.telefono.includes(term)) ||
      vehiculosMatch
    );
  });

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = {
      nombre: (form.elements.namedItem('nombre') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      telefono: (form.elements.namedItem('telefono') as HTMLInputElement).value,
      tipo: (form.elements.namedItem('tipo') as HTMLSelectElement).value || 'PARTULAR',
    };

    try {
      if (editClient) {
        await axios.put(`/api/clientes/${editClient.id}`, data);
      } else {
        await axios.post('/api/clientes', data);
      }
      setIsClientModalOpen(false);
      setEditClient(null);
      fetchClientes();
    } catch (error) {
      alert("Error guardando cliente");
    }
  };

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetClienteId) return;

    const form = e.target as HTMLFormElement;
    const data = {
      clienteId: targetClienteId,
      marca: (form.elements.namedItem('marca') as HTMLInputElement).value,
      modelo: (form.elements.namedItem('modelo') as HTMLInputElement).value,
      anio: (form.elements.namedItem('anio') as HTMLInputElement).value,
      color: (form.elements.namedItem('color') as HTMLInputElement).value,
      placas: (form.elements.namedItem('placas') as HTMLInputElement).value,
    };

    try {
      await axios.post('/api/vehiculos', data);
      setIsVehicleModalOpen(false);
      setTargetClienteId(null);
      fetchClientes();
    } catch (error) {
      alert("Error guardando vehículo");
    }
  };

  const openNewClientModal = () => {
    setEditClient(null);
    setIsClientModalOpen(true);
  };

  const openEditClientModal = (client: any) => {
    setEditClient(client);
    setIsClientModalOpen(true);
  };

  const openNewVehicleModal = (clientId: string) => {
    setTargetClienteId(clientId);
    setIsVehicleModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 md:p-6 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 flex items-center">
            <User className="w-6 h-6 md:w-8 md:h-8 mr-3 text-indigo-600" />
            Directorio de Clientes
          </h1>
          <p className="text-sm text-slate-500 mt-1">Administra los clientes y sus vehículos registrados</p>
        </div>
        <Dialog open={isClientModalOpen} onOpenChange={setIsClientModalOpen}>
          <Button onClick={openNewClientModal} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Cliente
          </Button>
          <DialogContent className="sm:max-w-md w-[95vw]">
            <DialogHeader>
              <DialogTitle>{editClient ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveClient} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre / Razón Social</Label>
                <Input id="nombre" defaultValue={editClient?.nombre} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo</Label>
                <Select name="tipo" defaultValue={editClient?.tipo || "PARTICULAR"}>
                  <SelectTrigger id="tipo">
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PARTICULAR">Particular</SelectItem>
                    <SelectItem value="EMPRESA">Empresa (Flotilla)</SelectItem>
                    <SelectItem value="ASEGURADORA">Aseguradora</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input id="telefono" defaultValue={editClient?.telefono} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue={editClient?.email} />
                </div>
              </div>
              
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">
                Guardar Cliente
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            type="search" 
            placeholder="Buscar por nombre, teléfono o placas..." 
            className="pl-10 bg-slate-50 border-slate-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Vehiculo Dialog (Hidden, but active when state is true) */}
      <Dialog open={isVehicleModalOpen} onOpenChange={setIsVehicleModalOpen}>
        <DialogContent className="sm:max-w-md w-[95vw]">
          <DialogHeader>
            <DialogTitle>Registrar Nuevo Vehículo</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveVehicle} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="marca">Marca</Label>
                <Input id="marca" required placeholder="Ej. Nissan" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modelo">Modelo</Label>
                <Input id="modelo" required placeholder="Ej. Versa" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="anio">Año</Label>
                <Input id="anio" required type="number" placeholder="Ej. 2018" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input id="color" required placeholder="Ej. Blanco" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="placas">Placas / Matrícula</Label>
              <Input id="placas" required className="font-mono uppercase" placeholder="ABC-123-A" />
            </div>
            
            <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800">
              Guardar Vehículo
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 gap-6">
        {filteredClientes.map((cliente) => (
          <div key={cliente.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm flex flex-col lg:flex-row hover:shadow-md transition-shadow">
            {/* Detalles del Cliente */}
            <div className="p-6 lg:w-1/3 lg:border-r border-b lg:border-b-0 border-slate-100 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                       <User className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 leading-tight">{cliente.nombre}</h3>
                      <Badge variant="secondary" className="bg-slate-100 text-slate-600 mt-1 font-medium text-[10px]">
                        {cliente.tipo || 'PARTICULAR'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-slate-600 mt-2">
                  {cliente.telefono && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-slate-400" />
                      <a href={`tel:${cliente.telefono}`} className="hover:text-indigo-600">{cliente.telefono}</a>
                    </div>
                  )}
                  {cliente.email && (
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-slate-400" />
                      <a href={`mailto:${cliente.email}`} className="hover:text-indigo-600">{cliente.email}</a>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100">
                 <Button variant="outline" size="sm" onClick={() => openEditClientModal(cliente)} className="w-full text-slate-600 border-slate-200 hover:bg-slate-50">
                   <FileEdit className="w-4 h-4 mr-2" /> Editar Perfil
                 </Button>
              </div>
            </div>

            {/* Vehículos del Cliente */}
            <div className="p-6 lg:w-2/3 bg-slate-50/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                <h4 className="text-sm font-semibold text-slate-700 flex items-center tracking-wider uppercase">
                  <Car className="h-4 w-4 mr-2 text-indigo-500" />
                  Vehículos
                </h4>
                <Button onClick={() => openNewVehicleModal(cliente.id)} variant="outline" size="sm" className="bg-white border-slate-200 hover:bg-slate-50 text-indigo-600">
                  <Plus className="h-3 w-3 mr-1" /> Agregar Vehículo
                </Button>
              </div>
              
              {cliente.vehiculos && cliente.vehiculos.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {cliente.vehiculos.map((v: any) => (
                    <VehicleCard key={v.id} vehiculo={v} onPhotoUpdated={fetchClientes} />
                  ))}
                </div>
              ) : (
                <div className="bg-white border border-slate-200 border-dashed rounded-lg p-6 text-center">
                  <Car className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Este cliente aún no tiene vehículos registrados.</p>
                  <Button onClick={() => openNewVehicleModal(cliente.id)} variant="link" className="text-indigo-600 mt-1">Registrar el primero</Button>
                </div>
              )}
            </div>
          </div>
        ))}
        {filteredClientes.length === 0 && (
          <div className="text-center py-16 bg-white rounded-lg border border-slate-200 shadow-sm">
            <User className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-lg text-slate-600 font-medium">No se encontraron clientes.</p>
            <p className="text-sm text-slate-500 mt-1">Prueba con otra búsqueda o registra un nuevo cliente.</p>
          </div>
        )}
      </div>
    </div>
  );
}
