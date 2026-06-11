import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, FileSignature, CheckCircle, XCircle, Camera } from "lucide-react";
import axios from "@/src/lib/api";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import EvidenciasGallery from "@/components/EvidenciasGallery";

export default function Presupuestos() {
  const [presupuestos, setPresupuestos] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isNuevoOpen, setIsNuevoOpen] = useState(false);
  const navigate = useNavigate();

  // Form states para nuevo presupuesto
  const [placas, setPlacas] = useState("");
  const [descripcionDano, setDescripcionDano] = useState("");
  const [montoEstimado, setMontoEstimado] = useState("");
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteTelefono, setClienteTelefono] = useState("");

  const fetchPresupuestos = () => {
    axios.get("/api/presupuestos").then((res) => {
      if (Array.isArray(res.data)) setPresupuestos(res.data);
    }).catch(console.error);
  };

  useEffect(() => {
    fetchPresupuestos();
  }, []);

  const handleCreateGroup = async () => {
    if (!placas || !descripcionDano) {
      alert("Placas y descripción son requeridos");
      return;
    }
    try {
      await axios.post("/api/presupuestos", {
        placas,
        descripcionDano,
        montoEstimado: montoEstimado || "0",
        clienteNombre,
        clienteTelefono
      });
      setIsNuevoOpen(false);
      fetchPresupuestos();
      // Limpiar
      setPlacas("");
      setDescripcionDano("");
      setMontoEstimado("");
      setClienteNombre("");
      setClienteTelefono("");
    } catch (e) {
      alert("Error al crear presupuesto");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await axios.patch(`/api/presupuestos/${id}/rechazar`);
      fetchPresupuestos();
    } catch (e) {
      alert("Error al rechazar");
    }
  };

  // State para formalizar
  const [formalizarOpen, setFormalizarOpen] = useState(false);
  const [formalizarId, setFormalizarId] = useState("");
  const [fMarca, setFMarca] = useState("");
  const [fModelo, setFModelo] = useState("");
  const [fNombre, setFNombre] = useState("");
  const [fTel, setFTel] = useState("");

  const abrirFormalizar = (p: any) => {
    setFormalizarId(p.id);
    setFNombre(p.clienteNombre || "");
    setFTel(p.clienteTelefono || "");
    setFMarca("");
    setFModelo("");
    setFormalizarOpen(true);
  };

  const handleFormalizar = async () => {
    try {
      const res = await axios.post(`/api/presupuestos/${formalizarId}/aprobar`, {
        clienteInfo: { nombre: fNombre, telefono: fTel },
        vehiculoInfo: { marca: fMarca, modelo: fModelo }
      });
      setFormalizarOpen(false);
      navigate(`/ordenes/${res.data.ot.id}`);
    } catch (e) {
      alert("Error al formalizar: Completa los datos mínimos (Nombre, Marca, Modelo)");
    }
  };

  const filtered = presupuestos.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      (p.folio || "").toLowerCase().includes(term) ||
      (p.placas || "").toLowerCase().includes(term) ||
      (p.clienteNombre || "").toLowerCase().includes(term)
    );
  });

  const getStatusBadge = (estado: string) => {
    if (estado === "PENDIENTE") return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
    if (estado === "APROBADO") return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">Aprobado / OT</Badge>;
    if (estado === "RECHAZADO") return <Badge variant="secondary" className="bg-slate-200 text-slate-800">Rechazado</Badge>;
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Presupuestos Rápidos</h1>
          <p className="text-sm text-slate-500">Captura ingresos express sin datos formales, aprueba y convierte a OT.</p>
        </div>
        <Dialog open={isNuevoOpen} onOpenChange={setIsNuevoOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Presupuesto Rápido
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Valoración Rápida (Recepción)</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Placas del Vehículo *</Label>
                  <Input value={placas} onChange={e=>setPlacas(e.target.value)} placeholder="ABC-123" />
                </div>
                <div className="space-y-2">
                  <Label>Monto Estimado ($)</Label>
                  <Input type="number" value={montoEstimado} onChange={e=>setMontoEstimado(e.target.value)} placeholder="Opcional" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descripción del Daño *</Label>
                <Textarea value={descripcionDano} onChange={e=>setDescripcionDano(e.target.value)} placeholder="Golpe en fascia trasera..." />
              </div>

              <div className="pt-2 border-t font-semibold text-sm">Datos de Contacto (Opcionales por ahora)</div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre Rápido</Label>
                  <Input value={clienteNombre} onChange={e=>setClienteNombre(e.target.value)} placeholder="Ej. Juan Pérez" />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input value={clienteTelefono} onChange={e=>setClienteTelefono(e.target.value)} placeholder="Ej. 55..." />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">Nota: Podrás añadir fotos y evidencias de los daños inmediatamente después de guardar el presupuesto, desde la tabla principal.</p>
              <Button onClick={handleCreateGroup} className="w-full mt-4">Guardar Presupuesto</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input 
            type="search" 
            placeholder="Buscar por placa, folio o nombre..." 
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
              <TableHead>Fecha</TableHead>
              <TableHead>Placas</TableHead>
              <TableHead>Daño / Reparación</TableHead>
              <TableHead>Estimado</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium text-slate-900">{p.folio}</TableCell>
                <TableCell className="text-slate-500">{format(new Date(p.createdAt), "dd/MM/yyyy HH:mm")}</TableCell>
                <TableCell><Badge variant="outline" className="font-mono bg-slate-50">{p.placas}</Badge></TableCell>
                <TableCell className="max-w-[200px] truncate" title={p.descripcionDano}>{p.descripcionDano}</TableCell>
                <TableCell className="font-medium text-slate-700">${p.montoEstimado.toFixed(2)}</TableCell>
                <TableCell>{getStatusBadge(p.estado)}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-800" title="Evidencias y Fotos">
                        <Camera className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                      <DialogHeader>
                        <DialogTitle>Evidencias del Presupuesto {p.folio}</DialogTitle>
                      </DialogHeader>
                      <div className="py-4">
                        <EvidenciasGallery entityId={p.id} entityType="presupuesto" />
                      </div>
                    </DialogContent>
                  </Dialog>
                  {p.estado === "PENDIENTE" && (
                    <>
                      <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => abrirFormalizar(p)}>
                        <CheckCircle className="h-4 w-4 mr-1" /> Aprobar & OT
                      </Button>
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleReject(p.id)}>
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {p.estado === "APROBADO" && p.ordenTrabajo && (
                     <Button variant="outline" size="sm" onClick={() => navigate(`/ordenes/${p.ordenTrabajo.id}`)}>
                       Ver OT ({p.ordenTrabajo.folio})
                     </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-slate-500">
                  No hay presupuestos rápidos registrados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={formalizarOpen} onOpenChange={setFormalizarOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Formalizar a OT</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 text-sm text-slate-600">
            <p>Para convertir este presupuesto aprobado en una Orden de Trabajo real, necesitamos datos formales del cliente y el vehículo (si no existen se crearán).</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <Label>Nombre Formal Cliente *</Label>
                 <Input value={fNombre} onChange={e=>setFNombre(e.target.value)} />
              </div>
              <div className="space-y-2">
                 <Label>Teléfono *</Label>
                 <Input value={fTel} onChange={e=>setFTel(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <Label>Marca del Vehículo *</Label>
                 <Input value={fMarca} onChange={e=>setFMarca(e.target.value)} placeholder="Ej. Nissan" />
              </div>
              <div className="space-y-2">
                 <Label>Modelo *</Label>
                 <Input value={fModelo} onChange={e=>setFModelo(e.target.value)} placeholder="Ej. Versa o Sentra" />
              </div>
            </div>
            <Button onClick={handleFormalizar} className="w-full mt-2">Aprobar y Crear OT Formal</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
