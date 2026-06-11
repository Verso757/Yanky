import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Car, Settings, MessageCircle, DollarSign } from "lucide-react";
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

  const fetchOt = () => {
    axios.get("/api/ordenes").then((res) => {
      if (Array.isArray(res.data)) {
        const found = res.data.find((o: any) => o.id === id);
        setOt(found);
      }
    }).catch(console.error);
  };

  useEffect(() => {
    fetchOt();
  }, [id]);

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

  if (!ot) return <div className="p-8 text-center text-slate-500">Cargando detalles...</div>;

  const wappMessage = encodeURIComponent(`Hola ${ot.cliente.nombre}, te contactamos de Yanky Taller sobre tu vehiculo ${ot.vehiculo.marca} placas ${ot.vehiculo.placas}.`);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/ordenes">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{ot.folio}</h1>
            <p className="text-sm text-slate-500">
              Ingreso: {format(new Date(ot.fechaIngreso), "dd/MM/yyyy HH:mm")}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" asChild>
            <a href={`https://wa.me/${ot.cliente.telefono}?text=${wappMessage}`} target="_blank" rel="noreferrer">
              <MessageCircle className="h-4 w-4 mr-2" />
              WhatsApp
            </a>
          </Button>

          <Dialog open={isEstadoOpen} onOpenChange={setIsEstadoOpen}>
            <DialogTrigger asChild>
              <Button>Actualizar Estado</Button>
            </DialogTrigger>
            <DialogContent>
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
                <Button onClick={handleUpdateEstado} className="w-full">Guardar Cambios</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Descripción del Servicio</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 whitespace-pre-wrap">{ot.descripcion}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Finanzas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between border-b pb-2 mb-2">
                <span className="text-slate-500">Monto Cotizado (Base)</span>
                <span className="font-semibold">${ot.montoCotizado.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b pb-2 mb-2">
                <span className="text-slate-500">Pagos Recibidos</span>
                <span className="font-semibold text-green-600">${ot.montoCobrado.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg mb-4">
                <span className="font-bold">Saldo Pendiente</span>
                <span className="font-bold text-red-600">${(ot.montoCotizado - ot.montoCobrado).toFixed(2)}</span>
              </div>

              <Dialog open={isPagoOpen} onOpenChange={setIsPagoOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <DollarSign className="w-4 h-4 mr-2" /> Registrar Pago
                  </Button>
                </DialogTrigger>
                <DialogContent>
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
                    <Button onClick={handleCreatePago} className="w-full">Guardar Pago</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <EvidenciasGallery entityId={id!} entityType="orden" />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-500 flex items-center">
                <Settings className="w-4 h-4 mr-2" />
                Estado Actual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className="text-base px-3 py-1 shadow-sm mb-2">{ot.estado.replace("_", " ")}</Badge>
              <p className="text-sm text-slate-500">Origen: {ot.origen.replace(/_/g, " ")}</p>
              <p className="text-sm text-slate-500">Paga: {ot.quienPaga}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-500 flex items-center">
                <User className="w-4 h-4 mr-2" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium text-slate-900">{ot.cliente.nombre}</p>
              <p className="text-sm text-slate-500">{ot.cliente.telefono}</p>
              <p className="text-sm text-slate-500">{ot.cliente.tipo}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-500 flex items-center">
                <Car className="w-4 h-4 mr-2" />
                Vehículo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium text-slate-900">{ot.vehiculo.marca} {ot.vehiculo.modelo}</p>
              <p className="text-sm text-slate-500">Año: {ot.vehiculo.anio}</p>
              <p className="text-sm text-slate-500">Color: {ot.vehiculo.color}</p>
              <p className="text-sm text-slate-500 tracking-wider">Placas: <span className="font-mono text-slate-900 border rounded px-1">{ot.vehiculo.placas}</span></p>
              {ot.kilometraje && (
                <p className="text-sm text-slate-500 mt-1">Km: {ot.kilometraje.toLocaleString()}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
