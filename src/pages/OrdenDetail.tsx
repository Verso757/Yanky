import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "@/src/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Car, Settings, MessageCircle, DollarSign, Calendar, CheckCircle, FileText, Printer } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import EvidenciasGallery from "@/components/EvidenciasGallery";

export default function OrdenDetail() {
  const { id } = useParams();
  const [ot, setOt] = useState<any>(null);
  const [pagoMonto, setPagoMonto] = useState("");
  const [pagoMetodo, setPagoMetodo] = useState("EFECTIVO");
  const [isPagoOpen, setIsPagoOpen] = useState(false);
  const [estadoToUpdate, setEstadoToUpdate] = useState("INGRESADO");
  const [isEstadoOpen, setIsEstadoOpen] = useState(false);
  
  const [isEntregaOpen, setIsEntregaOpen] = useState(false);
  const [quienRecibe, setQuienRecibe] = useState("");
  const [notasEntrega, setNotasEntrega] = useState("");

  const [tecnicos, setTecnicos] = useState<any[]>([]);
  const [isTecnicoOpen, setIsTecnicoOpen] = useState(false);
  const [tecnicoIdToUpdate, setTecnicoIdToUpdate] = useState("");

  const fetchOt = () => {
    axios.get("/api/ordenes").then((res) => {
      if (Array.isArray(res.data)) {
        const found = res.data.find((o: any) => o.id === id);
        setOt(found);
        if (found?.estado) setEstadoToUpdate(found.estado);
        if (found?.mecanicoAsignado) setTecnicoIdToUpdate(found.mecanicoAsignado);
      }
    }).catch(console.error);
  };

  const fetchTecnicos = () => {
    axios.get("/api/usuarios").then((res) => {
      if (Array.isArray(res.data)) {
        const t = res.data.filter((u: any) => u.rol === "TECNICO");
        setTecnicos(t);
      }
    }).catch(console.error);
  };

  useEffect(() => {
    fetchOt();
    fetchTecnicos();
  }, [id]);

  const handleUpdateTecnico = async () => {
    if (!tecnicoIdToUpdate) return;
    try {
      const selected = tecnicos.find(t => t.id === tecnicoIdToUpdate);
      await axios.patch(`/api/ordenes/${id}/tecnico`, {
        tecnicoId: selected.id,
        tecnicoNombre: selected.nombre
      });
      setIsTecnicoOpen(false);
      fetchOt();
    } catch(e) {
      alert("Error al asignar técnico");
    }
  };

  const handleCreatePago = async () => {
    try {
      await axios.post(`/api/ordenes/${id}/pago`, {
        monto: pagoMonto,
        metodo: pagoMetodo,
        pagador: ot?.quienPaga || 'CLIENTE'
      });
      setIsPagoOpen(false);
      setPagoMonto("");
      fetchOt();
    } catch(e) {
      alert("Error al registrar pago");
    }
  };

  const handleUpdateEstado = async () => {
    try {
      await axios.patch(`/api/ordenes/${id}/estado`, {
        estado: estadoToUpdate
      });
      setIsEstadoOpen(false);
      fetchOt();
    } catch (e) {
      alert("Error al actualizar estado");
    }
  };

  const handleConfirmEntrega = async () => {
    if (!quienRecibe) {
      alert("Debes indicar quién recibe el vehículo.");
      return;
    }
    try {
      await axios.post(`/api/ordenes/${id}/entregar`, {
        quienRecibe,
        notasEntrega
      });
      setIsEntregaOpen(false);
      fetchOt();
    } catch (e) {
      alert("Error al procesar la entrega");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!ot) return <div className="p-8 text-center text-slate-500">Cargando detalles...</div>;

  const wappMessage = encodeURIComponent(`Hola ${ot.cliente?.nombre || 'Cliente'}, te contactamos de Yanky Taller sobre tu vehiculo ${ot.vehiculo?.marca || ''} placas ${ot.vehiculo?.placas || ''}.`);

  return (
    <>
      {/* --- VISTA DE IMPRESIÓN (PDF) --- */}
      <div className="hidden print:block font-sans text-black bg-white w-full">
        <div className="border-b-2 border-slate-800 pb-4 mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Yanky Taller Automotriz</h1>
          <p className="text-sm text-slate-500">Folio: {ot.folio} - {ot.origen?.replace(/_/g, " ")}</p>
          <p className="text-sm text-slate-500">Fecha Ingreso: {ot.createdAt ? format(new Date(ot.createdAt), "dd/MM/yyyy HH:mm") : "--"}</p>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="font-bold border-b border-slate-300 mb-2 pb-1">Datos del Cliente</h3>
            <p className="text-sm"><strong>Nombre:</strong> {ot.cliente?.nombre || 'Sin registrar'}</p>
            <p className="text-sm"><strong>Teléfono:</strong> {ot.cliente?.telefono || 'Sin registrar'}</p>
            <p className="text-sm"><strong>Tipo:</strong> {ot.cliente?.tipo || 'N/A'}</p>
          </div>
          <div>
            <h3 className="font-bold border-b border-slate-300 mb-2 pb-1">Datos del Vehículo</h3>
            <p className="text-sm"><strong>Vehículo:</strong> {ot.vehiculo?.marca} {ot.vehiculo?.modelo} {ot.vehiculo?.anio}</p>
            <p className="text-sm"><strong>Color:</strong> {ot.vehiculo?.color || 'N/A'}</p>
            <p className="text-sm"><strong>Placas:</strong> {ot.vehiculo?.placas || 'N/A'}</p>
            <p className="text-sm"><strong>Kilometraje:</strong> {ot.kilometraje?.toLocaleString() || "N/A"} km</p>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="font-bold border-b border-slate-300 mb-2 pb-1">Check-in de Ingreso</h3>
          <table className="w-full text-sm text-left border border-slate-200">
            <tbody>
              <tr className="border-b border-slate-200"><td className="p-2 font-medium bg-slate-50 w-1/3">Nivel de Gasolina:</td><td className="p-2">{ot.nivelGasolina || "No registrado"}</td></tr>
              <tr className="border-b border-slate-200"><td className="p-2 font-medium bg-slate-50 w-1/3">Inventario / Objetos:</td><td className="p-2">{ot.inventario || "Ninguno"}</td></tr>
              <tr className="border-b border-slate-200"><td className="p-2 font-medium bg-slate-50 w-1/3">Daños Previos:</td><td className="p-2">{ot.notasExterior || "Ninguno detallado"}</td></tr>
            </tbody>
          </table>
        </div>

        <div className="mb-8">
          <h3 className="font-bold border-b border-slate-300 mb-2 pb-1">Descripción del Servicio</h3>
          <p className="text-sm whitespace-pre-wrap">{ot.descripcion}</p>
        </div>

        <div className="mb-8 ml-auto w-1/2">
          <table className="w-full text-sm text-right border border-slate-200">
            <tbody>
              <tr className="border-b border-slate-200"><td className="p-2 font-medium bg-slate-50 w-2/3">Cotización Base:</td><td className="p-2">${(Number(ot.montoCotizado) || 0).toFixed(2)}</td></tr>
              <tr className="border-b border-slate-200"><td className="p-2 font-medium bg-slate-50 w-2/3">Pagos / Abonos:</td><td className="p-2">${(Number(ot.montoCobrado) || 0).toFixed(2)}</td></tr>
              <tr><td className="p-2 font-bold bg-slate-100 w-2/3">Saldo Pendiente:</td><td className="p-2 font-bold">${((Number(ot.montoCotizado) || 0) - (Number(ot.montoCobrado) || 0)).toFixed(2)}</td></tr>
            </tbody>
          </table>
        </div>

        <div className="mt-20 pt-10 grid grid-cols-2 gap-16 text-center text-sm">
          <div>
            <div className="border-t border-slate-800 w-3/4 mx-auto pt-2">Firma del Cliente de Conformidad</div>
          </div>
          <div>
            <div className="border-t border-slate-800 w-3/4 mx-auto pt-2">Firma del Taller (Recepción)</div>
          </div>
        </div>
      </div>

      {/* --- VISTA NORMAL DE PANTALLA --- */}
      <div className="space-y-6 max-w-6xl mx-auto pb-10 print:hidden">
      {/* Header Area */}
      <div className="bg-white p-4 md:p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link to="/ordenes">
            <Button variant="outline" size="icon" className="hover:bg-slate-100">
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">{ot.folio}</h1>
              <Badge className="text-sm px-2 py-0.5" variant="secondary">{ot.estado.replace("_", " ")}</Badge>
            </div>
            <p className="text-sm text-slate-500 flex items-center">
              <Calendar className="w-4 h-4 mr-1.5 opacity-70" />
              Ingreso: {ot.createdAt ? format(new Date(ot.createdAt), "dd/MM/yyyy HH:mm") : "--"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button nativeButton={false} variant="outline" className="text-slate-600 border-slate-200 hover:bg-slate-50" render={<button onClick={handlePrint} />}>
            <Printer className="h-4 w-4 mr-2" />
            PDF / Imprimir
          </Button>

          <Button nativeButton={false} variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50" render={<a href={`https://wa.me/${ot.cliente?.telefono}?text=${wappMessage}`} target="_blank" rel="noreferrer" />}>
            <MessageCircle className="h-4 w-4 mr-2" />
            WhatsApp
          </Button>

          <Dialog open={isTecnicoOpen} onOpenChange={setIsTecnicoOpen}>
            <Button variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 w-full md:w-auto" render={<DialogTrigger />}>
              <User className="w-4 h-4 mr-2" />
              {ot.nombreMecanicoAsignado ? "Cambiar Técnico" : "Asignar Técnico"}
            </Button>
            <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Asignar Técnico a la Orden</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Técnico Disponible</Label>
                  <Select value={tecnicoIdToUpdate} onValueChange={setTecnicoIdToUpdate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un técnico" />
                    </SelectTrigger>
                    <SelectContent>
                      {tecnicos.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleUpdateTecnico} className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={!tecnicoIdToUpdate}>Guardar Asignación</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isEstadoOpen} onOpenChange={setIsEstadoOpen}>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white w-full md:w-auto" render={<DialogTrigger />}>
              Actualizar Estado
            </Button>
            <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Actualizar Estado de la Orden</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nuevo Estado</Label>
                  <Select value={estadoToUpdate} onValueChange={setEstadoToUpdate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INGRESADO">INGRESADO</SelectItem>
                      <SelectItem value="EN_DIAGNOSTICO">EN DIAGNÓSTICO</SelectItem>
                      <SelectItem value="EN_PROCESO">EN PROCESO</SelectItem>
                      <SelectItem value="LISTO">LISTO PARA ENTREGAR</SelectItem>
                      <SelectItem value="ENTREGADO">ENTREGADO</SelectItem>
                      <SelectItem value="CANCELADO">CANCELADO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleUpdateEstado} className="w-full bg-indigo-600 hover:bg-indigo-700">Guardar Cambios</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Main Info) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
              <CardTitle className="text-lg flex items-center text-slate-800">
                <Settings className="w-5 h-5 mr-2 text-indigo-600" />
                Descripción del Servicio
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{ot.descripcion}</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
              <CardTitle className="text-lg flex items-center text-slate-800">
                <DollarSign className="w-5 h-5 mr-2 text-emerald-600" />
                Balance y Finanzas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                 <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <span className="text-xs text-slate-500 font-medium uppercase tracking-wider block mb-1">Monto Cotizado</span>
                    <span className="text-xl font-bold text-slate-900">${(Number(ot.montoCotizado) || 0).toFixed(2)}</span>
                 </div>
                 <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                    <span className="text-xs text-emerald-600 font-medium uppercase tracking-wider block mb-1">Pagos Recibidos</span>
                    <span className="text-xl font-bold text-emerald-700">${(Number(ot.montoCobrado) || 0).toFixed(2)}</span>
                 </div>
                 <div className="bg-rose-50 p-4 rounded-lg border border-rose-100">
                    <span className="text-xs text-rose-600 font-medium uppercase tracking-wider block mb-1">Saldo Pendiente</span>
                    <span className="text-xl font-bold text-rose-700">${((Number(ot.montoCotizado) || 0) - (Number(ot.montoCobrado) || 0)).toFixed(2)}</span>
                 </div>
              </div>

              <Dialog open={isPagoOpen} onOpenChange={setIsPagoOpen}>
                <Button className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white" render={<DialogTrigger />}>
                  <DollarSign className="w-4 h-4 mr-2" /> Registrar Nuevo Abono
                </Button>
                <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Registrar Pago / Abono</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Monto a registrar ($)</Label>
                      <Input type="number" value={pagoMonto} onChange={e=>setPagoMonto(e.target.value)} placeholder="Ej. 1500" />
                    </div>
                    <div className="space-y-2">
                      <Label>Método de Pago</Label>
                      <Select value={pagoMetodo} onValueChange={setPagoMetodo}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                          <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
                          <SelectItem value="TARJETA">Tarjeta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleCreatePago} className="w-full bg-slate-900 hover:bg-slate-800">Guardar Pago</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm overflow-hidden">
             <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
              <CardTitle className="text-lg flex items-center text-slate-800">
                Evidencias Fotográficas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <EvidenciasGallery entityId={id!} entityType="orden" categoria="GENERAL" title="Fotos Generales (Daños, proceso)" />
            </CardContent>
          </Card>

          {/* Entrega Card */}
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
              <CardTitle className="text-lg flex items-center text-slate-800">
                <CheckCircle className="w-5 h-5 mr-2 text-indigo-600" />
                Protocolo de Entrega / Salida
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {ot.estado === "ENTREGADO" ? (
                <div className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-md border border-green-100">
                    <p className="text-green-800 text-sm font-medium flex items-center"><CheckCircle className="w-4 h-4 mr-2" /> Vehículo Entregado Confirmado</p>
                    <p className="text-sm text-green-700 mt-2"><strong>Entregado a:</strong> {ot.datosEntrega?.quienRecibe}</p>
                    {ot.datosEntrega?.notasEntrega && <p className="text-sm text-green-700"><strong>Notas:</strong> {ot.datosEntrega.notasEntrega}</p>}
                    <p className="text-sm text-green-700"><strong>Fecha de entrega:</strong> {ot.datosEntrega?.fechaEntrega ? format(new Date(ot.datosEntrega?.fechaEntrega), "dd/MM/yyyy HH:mm") : "N/A"}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <EvidenciasGallery entityId={id!} entityType="orden" categoria="SALIDA-AUTO" title="Fotos del Vehículo (Salida)" />
                     </div>
                     <div>
                       <EvidenciasGallery entityId={id!} entityType="orden" categoria="SALIDA-ID" title="Identificación (INE/IFE)" />
                     </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">Al terminar la reparación y finanzas, registra la salida del vehículo capturando fotos comprobatorias y la identidad de quien recibe el auto.</p>
                  <Dialog open={isEntregaOpen} onOpenChange={setIsEntregaOpen}>
                    <Button onClick={() => setQuienRecibe(ot.cliente?.nombre || '')} className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white" render={<DialogTrigger />}>
                      <Car className="w-4 h-4 mr-2" />
                      Dar Salida al Vehículo
                    </Button>
                    <DialogContent className="sm:max-w-3xl w-[95vw] p-0 overflow-hidden flex flex-col max-h-[95vh]">
                      <DialogHeader className="bg-slate-50 p-6 border-b shrink-0">
                        <DialogTitle className="text-xl flex items-center">
                          <CheckCircle className="mr-2 h-5 w-5 text-indigo-600" /> 
                          Protocolo de Entrega de Vehículo
                        </DialogTitle>
                        <p className="text-sm text-slate-500 mt-1">Sube las fotos y confirma quién está llevándose el vehículo de las instalaciones.</p>
                      </DialogHeader>
                      <div className="p-6 overflow-y-auto flex-1 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="space-y-2">
                             <Label>¿Quién recibe el vehículo?</Label>
                             <Input value={quienRecibe} onChange={e=>setQuienRecibe(e.target.value)} placeholder="Nombre completo" />
                           </div>
                           <div className="space-y-2">
                             <Label>Notas Adicionales / Check-list</Label>
                             <Input value={notasEntrega} onChange={e=>setNotasEntrega(e.target.value)} placeholder="Ej. Se entregó con 2 llaves y tarjeta de circulación" />
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="border border-slate-100 rounded-lg p-4 bg-slate-50">
                             <EvidenciasGallery entityId={id!} entityType="orden" categoria="SALIDA-ID" title="Identificación Oficial (INE/IFE)" />
                          </div>
                          <div className="border border-slate-100 rounded-lg p-4 bg-slate-50">
                             <EvidenciasGallery entityId={id!} entityType="orden" categoria="SALIDA-AUTO" title="Fotos del Vehículo Terminado (Salida)" />
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 border-t shrink-0 flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsEntregaOpen(false)}>Cancelar</Button>
                        <Button onClick={handleConfirmEntrega} className="bg-indigo-600 hover:bg-indigo-700">Confirmar Salida Definitiva</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (Meta info) */}
        <div className="space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center uppercase tracking-wider">
                <User className="w-4 h-4 mr-2 text-indigo-500" />
                Datos del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div>
                 <span className="text-xs text-slate-500 block">Nombre</span>
                 <p className="font-medium text-slate-900">{ot.cliente?.nombre || 'Sin registrar'}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-xs text-slate-500 block">Teléfono</span>
                  <p className="text-sm text-slate-700">{ot.cliente?.telefono || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Tipo</span>
                  <Badge variant="outline" className="font-normal text-xs mt-0.5">{ot.cliente?.tipo || 'N/A'}</Badge>
                </div>
              </div>
              <div>
                 <span className="text-xs text-slate-500 block">Responsable del Pago</span>
                 <Badge variant="secondary" className="font-normal text-xs mt-0.5">{ot.quienPaga}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center uppercase tracking-wider">
                <Car className="w-4 h-4 mr-2 text-indigo-500" />
                Datos del Vehículo
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div>
                 <span className="text-xs text-slate-500 block">Vehículo</span>
                 <p className="font-medium text-slate-900">{ot.vehiculo?.marca} {ot.vehiculo?.modelo}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <span className="text-xs text-slate-500 block">Año</span>
                    <p className="text-sm text-slate-700">{ot.vehiculo?.anio}</p>
                 </div>
                 <div>
                    <span className="text-xs text-slate-500 block">Color</span>
                     <p className="text-sm text-slate-700">{ot.vehiculo?.color || 'N/A'}</p>
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <span className="text-xs text-slate-500 block">Placas</span>
                    <Badge variant="outline" className="font-mono text-xs bg-slate-50">{ot.vehiculo?.placas || 'N/A'}</Badge>
                 </div>
                 {ot.kilometraje && (
                   <div>
                      <span className="text-xs text-slate-500 block">Kilometraje</span>
                      <p className="text-sm text-slate-700">{ot.kilometraje.toLocaleString()} km</p>
                   </div>
                 )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
             <CardHeader className="pb-3 border-b border-slate-100">
               <CardTitle className="text-sm font-semibold text-slate-700 flex items-center uppercase tracking-wider">
                 <Settings className="w-4 h-4 mr-2 text-indigo-500" />
                 Contexto de Ingreso
               </CardTitle>
             </CardHeader>
             <CardContent className="pt-4 space-y-3">
                <div>
                   <span className="text-xs text-slate-500 block">Origen / Tipo</span>
                   <p className="text-sm text-slate-700 capitalize">{ot.origen?.replace(/_/g, " ").toLowerCase() || "--"}</p>
                </div>
                {ot.nombreMecanicoAsignado && (
                  <div className="pt-2 border-t border-slate-100 mt-2">
                     <span className="text-xs text-slate-500 block">Técnico Asignado</span>
                     <p className="text-sm font-medium text-indigo-700 flex items-center mt-1">
                       <User className="w-3.5 h-3.5 mr-1" />
                       {ot.nombreMecanicoAsignado}
                     </p>
                  </div>
                )}
             </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
             <CardHeader className="pb-3 border-b border-slate-100">
               <CardTitle className="text-sm font-semibold text-slate-700 flex items-center uppercase tracking-wider">
                 <CheckCircle className="w-4 h-4 mr-2 text-indigo-500" />
                 Check-in (Entrada)
               </CardTitle>
             </CardHeader>
             <CardContent className="pt-4 space-y-3">
                <div>
                   <span className="text-xs text-slate-500 block">Nivel de gasolina</span>
                   <p className="text-sm text-slate-700">{ot.nivelGasolina || "No registrado"}</p>
                </div>
                <div>
                   <span className="text-xs text-slate-500 block">Inventario / Objetos</span>
                   <p className="text-sm text-slate-700">{ot.inventario || "Ninguno"}</p>
                </div>
                <div>
                   <span className="text-xs text-slate-500 block">Daños previos exteriores</span>
                   <p className="text-sm text-slate-700">{ot.notasExterior || "Ninguno detallado"}</p>
                </div>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </>
  );
}
