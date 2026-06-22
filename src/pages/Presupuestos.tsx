import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, CheckCircle, XCircle, Camera, User, Car, Image as ImageIcon, ClipboardList } from "lucide-react";
import axios from "@/src/lib/api";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import EvidenciasGallery from "@/components/EvidenciasGallery";
import { useAuth } from "@/src/context/AuthContext";

export default function Presupuestos() {
  const { user } = useAuth();
  const [presupuestos, setPresupuestos] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isNuevoOpen, setIsNuevoOpen] = useState(false);
  const navigate = useNavigate();

  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Form states para nuevo presupuesto
  const [placas, setPlacas] = useState("");
  const [descripcionDano, setDescripcionDano] = useState("");
  const [montoEstimado, setMontoEstimado] = useState("");
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteTelefono, setClienteTelefono] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fotos, setFotos] = useState<FileList | null>(null);

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
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await axios.post("/api/presupuestos", {
        placas,
        descripcionDano,
        montoEstimado: montoEstimado || "0",
        clienteNombre,
        clienteTelefono,
        creadoPorId: user?.id,
        creadoPorNombre: user?.nombre
      });

      // Upload photos if any
      if (fotos && fotos.length > 0) {
        for (let i = 0; i < fotos.length; i++) {
          const file = fotos[i];
          const formData = new FormData();
          formData.append("file", file);
          formData.append("presupuestoId", res.data.id);
          formData.append("descripcion", `Foto captura inicial ${i + 1}`);
          
          await axios.post("/api/evidencias", formData);
        }
      }

      setIsNuevoOpen(false);
      fetchPresupuestos();
      // Limpiar
      setPlacas("");
      setDescripcionDano("");
      setMontoEstimado("");
      setClienteNombre("");
      setClienteTelefono("");
      setFotos(null);
    } catch (e) {
      alert("Error al crear presupuesto");
    } finally {
      setIsSubmitting(false);
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
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Presupuestos Rápidos</h1>
          <p className="text-sm text-slate-500">Captura ingresos express sin datos formales, aprueba y convierte a OT.</p>
        </div>
        <Dialog open={isNuevoOpen} onOpenChange={setIsNuevoOpen}>
          <Button render={<DialogTrigger />} className="w-full sm:w-auto shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Presupuesto Rápido
          </Button>
          <DialogContent className="sm:max-w-xl w-[95vw] p-0 overflow-hidden flex flex-col max-h-[95vh]">
            <DialogHeader className="bg-slate-50 p-6 border-b shrink-0">
              <DialogTitle className="text-xl flex items-center">
                <ClipboardList className="mr-2 h-5 w-5 text-blue-600" /> 
                Valoración Rápida
              </DialogTitle>
              <p className="text-sm text-slate-500 mt-1">Captura un prospecto o ingreso inicial estructurado en 3 pasos.</p>
            </DialogHeader>
            <div className="p-6 overflow-y-auto flex-1">
              <Tabs defaultValue="vehiculo">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="vehiculo"><Car className="w-4 h-4 mr-2" /> Vehículo</TabsTrigger>
                  <TabsTrigger value="cliente"><User className="w-4 h-4 mr-2" /> Cliente</TabsTrigger>
                  <TabsTrigger value="fotos"><Camera className="w-4 h-4 mr-2" /> Fotos</TabsTrigger>
                </TabsList>
                
                <TabsContent value="vehiculo" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Placas del Vehículo *</Label>
                      <Input value={placas} onChange={e=>setPlacas(e.target.value)} placeholder="Ej. ABC-123" className="font-mono uppercase" />
                    </div>
                    <div className="space-y-2">
                      <Label>Monto Estimado ($)</Label>
                      <Input type="number" value={montoEstimado} onChange={e=>setMontoEstimado(e.target.value)} placeholder="0.00" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Descripción del Daño *</Label>
                    <Textarea 
                      value={descripcionDano} 
                      onChange={e=>setDescripcionDano(e.target.value)} 
                      placeholder="Ej. Golpe en fascia trasera, requiere pintura..." 
                      className="min-h-[100px]"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="cliente" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                      <Label>Nombre del Cliente</Label>
                      <Input value={clienteNombre} onChange={e=>setClienteNombre(e.target.value)} placeholder="Ej. Juan Pérez" />
                    </div>
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                      <Label>Teléfono de Contacto</Label>
                      <Input value={clienteTelefono} onChange={e=>setClienteTelefono(e.target.value)} placeholder="Ej. 55..." />
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-md border border-slate-100 text-sm text-slate-600 mt-4">
                    <p>Estos datos son opcionales en esta etapa. Puedes formalizarlos después al convertir a Orden de Trabajo.</p>
                  </div>
                </TabsContent>

                <TabsContent value="fotos" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Tomar Foto o Subir Imágenes</Label>
                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors">
                      <Input 
                        type="file" 
                        accept="image/*" 
                        capture="environment" 
                        multiple 
                        onChange={(e) => setFotos(e.target.files)} 
                        className="mx-auto max-w-[250px]"
                      />
                      <p className="text-xs text-slate-500 mt-2">Puedes tomar una o múltiples fotos del vehículo ahora mismo.</p>
                      {fotos && fotos.length > 0 && (
                        <div className="mt-4 inline-flex items-center text-sm text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                          <CheckCircle className="w-4 h-4 mr-1" /> {fotos.length} archivo(s) seleccionado(s)
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            
            <div className="p-4 bg-slate-50 border-t shrink-0 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsNuevoOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreateGroup} disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar Presupuesto"}
              </Button>
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

      <div className="rounded-md border bg-white shadow-sm overflow-hidden hidden md:block">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Folio</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Creado Por</TableHead>
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
                <TableCell className="text-slate-500 whitespace-nowrap">{p.createdAt ? format(new Date(p.createdAt), "dd/MM/yyyy HH:mm") : "--"}</TableCell>
                <TableCell className="text-sm text-slate-600">{p.creadoPorNombre || "Desconocido"}</TableCell>
                <TableCell><Badge variant="outline" className="font-mono bg-slate-50">{p.placas}</Badge></TableCell>
                <TableCell className="max-w-[200px] truncate block" title={p.descripcionDano}>{p.descripcionDano}</TableCell>
                <TableCell className="font-medium text-slate-700">${(p.montoEstimado || 0).toFixed(2)}</TableCell>
                <TableCell>{getStatusBadge(p.estado)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => { setSelectedRow(p); setDetailsOpen(true); }} className="text-blue-600 border-blue-200 hover:bg-blue-50">
                    <ClipboardList className="h-4 w-4 mr-2" /> Detalle
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-slate-500">
                  No hay presupuestos rápidos registrados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Vista Móvil: Tarjetas en vez de tabla en pantallas pequeñas */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {filtered.map((p) => (
          <Card key={p.id} className="overflow-hidden shadow-sm">
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="font-bold text-slate-900">{p.folio}</div>
                  <Badge variant="outline" className="font-mono bg-slate-50">{p.placas}</Badge>
                </div>
                {getStatusBadge(p.estado)}
              </div>
              
              <div className="text-sm text-slate-600 space-y-1 py-2 border-y border-slate-100">
                <p><strong>Daño:</strong> {p.descripcionDano}</p>
                <p><strong>Creado Por:</strong> {p.creadoPorNombre || "Desconocido"}</p>
                <p><strong>Fecha:</strong> {p.createdAt ? format(new Date(p.createdAt), "dd/MM/yyyy") : "--"}</p>
                <p><strong>Monto:</strong> ${(p.montoEstimado || 0).toFixed(2)}</p>
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <Button variant="outline" size="sm" onClick={() => { setSelectedRow(p); setDetailsOpen(true); }} className="flex-1 text-blue-600 border-blue-200">
                  <ClipboardList className="h-4 w-4 mr-2" /> Ver Detalles
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="text-center p-8 text-slate-500 bg-slate-50 rounded-lg border">
            No hay presupuestos rápidos registrados.
          </div>
        )}
      </div>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-2xl md:max-w-4xl w-[95vw] p-0 overflow-hidden flex flex-col max-h-[95vh]">
          <DialogHeader className="bg-slate-50 p-4 md:p-6 border-b shrink-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <DialogTitle className="text-xl flex items-center mb-1">
                  Detalles del Presupuesto {selectedRow?.folio}
                </DialogTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono bg-white">{selectedRow?.placas}</Badge>
                  {selectedRow?.estado && getStatusBadge(selectedRow.estado)}
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="p-4 md:p-6 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-3 bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
                <h3 className="font-semibold text-slate-800 border-b pb-2">Información del Daño</h3>
                <div className="text-sm text-slate-600 space-y-1">
                  <p><strong>Descripción:</strong> {selectedRow?.descripcionDano}</p>
                  <p><strong>Monto Estimado:</strong> ${(selectedRow?.montoEstimado || 0).toFixed(2)}</p>
                  <p><strong>Fecha Creación:</strong> {selectedRow?.createdAt ? format(new Date(selectedRow.createdAt), "dd/MM/yyyy HH:mm") : "--"}</p>
                  <p><strong>Creado Por:</strong> {selectedRow?.creadoPorNombre || "Desconocido"}</p>
                </div>
              </div>

              <div className="space-y-3 bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
                <h3 className="font-semibold text-slate-800 border-b pb-2">Datos Cliente</h3>
                <div className="text-sm text-slate-600 space-y-1">
                  <p><strong>Nombre:</strong> {selectedRow?.clienteNombre || "No proporcionado"}</p>
                  <p><strong>Teléfono:</strong> {selectedRow?.clienteTelefono || "No proporcionado"}</p>
                </div>
              </div>
            </div>

            <div className="mb-2">
              <h3 className="font-semibold text-slate-800 border-b pb-2 mb-4">Evidencias Fotográficas</h3>
              {selectedRow && (
                <EvidenciasGallery entityId={selectedRow.id} entityType="presupuesto" />
              )}
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-t shrink-0 flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>Cerrar</Button>
            {selectedRow?.estado === "PENDIENTE" && (
              <>
                <Button variant="outline" className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200" onClick={() => { setDetailsOpen(false); handleReject(selectedRow.id); }}>
                  <XCircle className="h-4 w-4 mr-2" /> Rechazar
                </Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { setDetailsOpen(false); abrirFormalizar(selectedRow); }}>
                  <CheckCircle className="h-4 w-4 mr-2" /> Aprobar & Convertir a OT
                </Button>
              </>
            )}
            {selectedRow?.estado === "APROBADO" && selectedRow?.ordenTrabajo && (
               <Button onClick={() => { setDetailsOpen(false); navigate(`/ordenes/${selectedRow.ordenTrabajo.id}`); }}>
                 Ver Orden de Trabajo
               </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={formalizarOpen} onOpenChange={setFormalizarOpen}>
        <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Formalizar a OT</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 text-sm text-slate-600">
            <p>Para convertir este presupuesto aprobado en una Orden de Trabajo real, necesitamos datos formales del cliente y el vehículo (si no existen se crearán).</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                 <Label>Nombre Formal Cliente *</Label>
                 <Input value={fNombre} onChange={e=>setFNombre(e.target.value)} />
              </div>
              <div className="space-y-2">
                 <Label>Teléfono *</Label>
                 <Input value={fTel} onChange={e=>setFTel(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
    </motion.div>
  );
}
