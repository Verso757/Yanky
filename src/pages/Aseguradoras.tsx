import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, Phone, Mail, FileText, Plus, Search, FileEdit, Eye, Calendar, DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import axios from "@/src/lib/api";
import { Link } from "react-router-dom";

export default function Aseguradoras() {
  const [aseguradoras, setAseguradoras] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nombre: "",
    ejecutivoNombre: "",
    telefono: "",
    email: "",
    condicionesPago: "30 días"
  });

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedAseguradora, setSelectedAseguradora] = useState<any>(null);

  const fetchData = () => {
    axios.get("/api/aseguradoras").then((res) => {
      if (Array.isArray(res.data)) {
        setAseguradoras(res.data);
      }
    }).catch(console.error);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openNew = () => {
    setEditingId(null);
    setFormData({ nombre: "", ejecutivoNombre: "", telefono: "", email: "", condicionesPago: "30 días" });
    setIsFormOpen(true);
  };

  const openEdit = (a: any) => {
    setEditingId(a.id);
    setFormData({
      nombre: a.nombre || "",
      ejecutivoNombre: a.ejecutivoNombre || "",
      telefono: a.telefono || "",
      email: a.email || "",
      condicionesPago: a.condicionesPago || "30 días",
    });
    setIsFormOpen(true);
  };

  const openDetails = (a: any) => {
    setSelectedAseguradora(a);
    setDetailsOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await axios.put(`/api/aseguradoras/${editingId}`, formData);
      } else {
        await axios.post("/api/aseguradoras", formData);
      }
      setIsFormOpen(false);
      fetchData();
    } catch (e) {
      alert("Error guardando aseguradora");
    }
  };

  const filtered = aseguradoras.filter(a => 
    a.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.ejecutivoNombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Aseguradoras</h1>
          <p className="text-sm text-slate-500">Gestión de seguros, contactos y cuentas por cobrar</p>
        </div>
        <Button onClick={openNew} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
          <Plus className="mr-2 h-4 w-4" /> Agregar Aseguradora
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input 
          placeholder="Buscar compañía o ejecutivo..." 
          className="pl-9 bg-white border-slate-200"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {filtered.map((a) => {
          const otsActivas = a.ots || [];
          const cotizaciones = otsActivas.filter((o: any) => o.origen === "SEGURO_FLUJO_B");
          const reparaciones = otsActivas.filter((o: any) => o.origen !== "SEGURO_FLUJO_B");
          const porCobrar = reparaciones.reduce((acc: number, o: any) => acc + (o.montoCotizado - (o.montoCobrado || 0)), 0);

          return (
            <Card key={a.id} className="hover:border-indigo-200 transition-colors shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100 bg-white rounded-t-xl">
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 mr-3">
                      <Shield className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-slate-900 leading-tight">
                        {a.nombre}
                      </CardTitle>
                      {a.ejecutivoNombre && (
                        <CardDescription className="text-slate-500 text-sm mt-0.5">
                           Ejecutivo: <span className="font-medium text-slate-700">{a.ejecutivoNombre}</span>
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(a)} className="h-8 w-8 text-slate-400 hover:text-indigo-600">
                      <FileEdit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openDetails(a)} className="h-8 w-8 text-slate-400 hover:text-indigo-600">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 grid sm:grid-cols-2 gap-4 bg-slate-50/50">
                <div className="space-y-2">
                  {a.telefono && (
                    <div className="flex items-center text-sm text-slate-600">
                      <Phone className="w-4 h-4 mr-2 text-slate-400 shrink-0" />
                      <span className="truncate">{a.telefono}</span>
                    </div>
                  )}
                  {a.email && (
                    <div className="flex items-center text-sm text-slate-600">
                      <Mail className="w-4 h-4 mr-2 text-slate-400 shrink-0" />
                      <span className="truncate">{a.email}</span>
                    </div>
                  )}
                  {a.condicionesPago && (
                    <div className="flex items-center text-sm text-slate-600">
                      <FileText className="w-4 h-4 mr-2 text-slate-400 shrink-0" />
                      Pago a {a.condicionesPago}
                    </div>
                  )}
                </div>
                
                <div className="space-y-3 bg-white border border-slate-100 rounded-lg p-3 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-medium">Reparaciones</span>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-bold">{reparaciones.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-medium">Cotizaciones</span>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-bold">{cotizaciones.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-100 pt-2">
                    <span className="text-xs text-slate-500 font-medium">Por Cobrar</span>
                    <span className="text-sm font-bold text-orange-600">${porCobrar.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center border rounded-xl bg-white border-dashed">
            <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No se encontraron aseguradoras.</p>
            <Button variant="link" onClick={openNew} className="text-indigo-600 p-0 h-auto mt-2">Agregar la primera</Button>
          </div>
        )}
      </div>

      {/* Formulario Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Aseguradora" : "Nueva Aseguradora"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Nombre de la Compañía *</Label>
              <Input value={formData.nombre} onChange={e=>setFormData({...formData, nombre: e.target.value})} placeholder="Ej. GNP Seguros" />
            </div>
            <div className="space-y-2">
              <Label>Nombre del Ejecutivo / Contacto</Label>
              <Input value={formData.ejecutivoNombre} onChange={e=>setFormData({...formData, ejecutivoNombre: e.target.value})} placeholder="Opcional" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input value={formData.telefono} onChange={e=>setFormData({...formData, telefono: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Condiciones de Pago</Label>
              <Input value={formData.condicionesPago} onChange={e=>setFormData({...formData, condicionesPago: e.target.value})} placeholder="Ej. 15 días, 30 días" />
            </div>
            <Button onClick={handleSave} className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={!formData.nombre}>
              Guardar Aseguradora
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detalles y OTs Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-2xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Shield className="w-6 h-6 text-indigo-600" />
              {selectedAseguradora?.nombre}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
               <div>
                  <p className="text-xs text-slate-500 font-medium mb-1">Contacto</p>
                  <p className="text-sm font-semibold text-slate-900">{selectedAseguradora?.ejecutivoNombre || "N/A"}</p>
               </div>
               <div>
                  <p className="text-xs text-slate-500 font-medium mb-1">Teléfono</p>
                  <p className="text-sm font-semibold text-slate-900">{selectedAseguradora?.telefono || "N/A"}</p>
               </div>
               <div>
                  <p className="text-xs text-slate-500 font-medium mb-1">Email</p>
                  <p className="text-sm font-medium text-indigo-600 truncate">{selectedAseguradora?.email || "N/A"}</p>
               </div>
               <div>
                  <p className="text-xs text-slate-500 font-medium mb-1">Pago a</p>
                  <p className="text-sm font-semibold text-slate-900">{selectedAseguradora?.condicionesPago || "N/A"}</p>
               </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-3 border-b pb-2">Órdenes de Trabajo y Cotizaciones</h3>
              
              {selectedAseguradora?.ots && selectedAseguradora.ots.length > 0 ? (
                <div className="space-y-3">
                  {selectedAseguradora.ots.map((ot: any) => {
                    const isCotizacion = ot.origen === "SEGURO_FLUJO_B";
                    const deudo = (ot.montoCotizado || 0) - (ot.montoCobrado || 0);

                    return (
                      <div key={ot.id} className="bg-white border text-left w-full border-slate-200 p-3 rounded-lg flex items-center justify-between hover:border-indigo-300 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-full shrink-0 ${isCotizacion ? 'bg-indigo-50' : (deudo > 0 ? 'bg-orange-50' : 'bg-emerald-50')}`}>
                            {isCotizacion ? <FileText className="w-4 h-4 text-indigo-600" /> : (deudo > 0 ? <DollarSign className="w-4 h-4 text-orange-600" /> : <Shield className="w-4 h-4 text-emerald-600" />)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Link to={`/ordenes/${ot.id}`} className="font-bold text-indigo-600 hover:underline text-sm uppercase">OT-{ot.id.slice(-5)}</Link>
                              <Badge variant="outline" className={`text-[10px] ${isCotizacion ? 'bg-indigo-50 text-indigo-700' : ''}`}>{ot.estado}</Badge>
                              {isCotizacion && <Badge variant="secondary" className="text-[10px]">COTIZACIÓN</Badge>}
                            </div>
                            <div className="flex items-center text-xs text-slate-500 gap-3">
                              <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {new Date(ot.createdAt).toLocaleDateString()}</span>
                              {ot.vehiculoPlacas && <span>{ot.vehiculoPlacas}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Monto: ${((ot.montoCotizado || 0)).toLocaleString()}</p>
                          {!isCotizacion && deudo > 0 ? (
                            <p className="text-sm font-bold text-orange-600">Resta: ${deudo.toLocaleString()}</p>
                          ) : !isCotizacion ? (
                            <p className="text-sm font-bold text-emerald-600">Pagado</p>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-50 rounded-lg border border-slate-100 border-dashed">
                  <p className="text-sm text-slate-500">No hay órdenes o cotizaciones asociadas a esta aseguradora.</p>
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t shrink-0 flex justify-end">
            <Button onClick={() => setDetailsOpen(false)}>Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
