import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Car, FileText, Settings, User } from "lucide-react";
import axios from "@/src/lib/api";

export default function OrdenNueva() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<any[]>([]);
  const [vehiculos, setVehiculos] = useState<any[]>([]);
  
  const [origen, setOrigen] = useState("DIRECTO");
  const [clienteId, setClienteId] = useState("");
  const [vehiculoId, setVehiculoId] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [kilometraje, setKilometraje] = useState("");
  const [montoCotizado, setMontoCotizado] = useState("");
  
  useEffect(() => {
    axios.get("/api/clientes").then((res) => {
      setClientes(res.data);
    });
  }, []);

  const handleClienteChange = (val: string) => {
    setClienteId(val);
    const cli = clientes.find((c) => c.id === val);
    if (cli) {
      setVehiculos(cli.vehiculos || []);
      setVehiculoId("");
    }
  };

  const handleSave = async () => {
    if (!clienteId || !vehiculoId || !descripcion) {
      alert("Por favor completa los campos principales (Cliente, Vehículo, Descripción)");
      return;
    }
    try {
      const payload = {
        origen,
        clienteId,
        vehiculoId,
        descripcion,
        kilometraje: kilometraje || null,
        montoCotizado: montoCotizado || 0,
        quienPaga: origen === "DIRECTO" ? "CLIENTE" : "ASEGURADORA"
      };
      const res = await axios.post("/api/ordenes", payload);
      navigate(`/ordenes/${res.data.id}`);
    } catch (e) {
      alert("Error al guardar la OT");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      <div className="bg-white p-4 md:p-6 rounded-lg border border-slate-200 shadow-sm flex items-center space-x-4">
        <Link to="/ordenes">
          <Button variant="outline" size="icon" className="hover:bg-slate-100">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Nueva Orden de Trabajo</h1>
          <p className="text-sm text-slate-500 mt-1">Ingreso de vehículo al taller o cotización</p>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
          <CardTitle className="text-lg flex items-center text-slate-800">
            <User className="w-5 h-5 mr-2 text-indigo-600" />
            Datos Principales
          </CardTitle>
          <CardDescription>Información del origen y clientes preexistentes.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-slate-700">Origen de OT</Label>
              <Select value={origen} onValueChange={setOrigen}>
                <SelectTrigger className="bg-slate-50">
                  <SelectValue placeholder="Seleccione el origen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DIRECTO">Cliente Directo</SelectItem>
                  <SelectItem value="SEGURO_FLUJO_A">Seguro - Reparación Autorizada</SelectItem>
                  <SelectItem value="SEGURO_FLUJO_B">Seguro - Solo Cotización</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700">Cliente Existente</Label>
              <Select value={clienteId} onValueChange={handleClienteChange}>
                <SelectTrigger className="bg-slate-50">
                  <SelectValue placeholder="Seleccione un cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nombre} ({c.telefono})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="text-slate-700 flex items-center">
                 <Car className="w-4 h-4 mr-2 text-slate-500" />
                 Vehículo del Cliente
              </Label>
              <Select value={vehiculoId} onValueChange={setVehiculoId} disabled={!clienteId}>
                <SelectTrigger className="bg-slate-50">
                  <SelectValue placeholder={clienteId ? "Seleccione el vehículo..." : "Primero seleccione un cliente"} />
                </SelectTrigger>
                <SelectContent>
                  {vehiculos.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.marca} {v.modelo} - Placas: {v.placas}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!clienteId && <p className="text-xs text-amber-600 mt-1">Debes seleccionar un cliente primero para ver sus vehículos.</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
          <CardTitle className="text-lg flex items-center text-slate-800">
            <Settings className="w-5 h-5 mr-2 text-indigo-600" />
            Detalles del Servicio
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <Label className="text-slate-700">Descripción del daño o servicio solicitado</Label>
              <Textarea 
                placeholder="Describa a detalle lo que se le hará al vehículo..." 
                className="min-h-[120px] bg-slate-50"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700">Kilometraje de Ingreso (Opcional)</Label>
              <Input 
                type="number" 
                placeholder="Ej. 125000" 
                className="bg-slate-50"
                value={kilometraje}
                onChange={(e) => setKilometraje(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700">Monto Cotizado Base ($)</Label>
              <Input 
                type="number" 
                placeholder="Ej. 5000" 
                className="bg-slate-50"
                value={montoCotizado}
                onChange={(e) => setMontoCotizado(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Link to="/ordenes">
          <Button variant="outline" className="border-slate-300 text-slate-700 bg-white">Cancelar</Button>
        </Link>
        <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">
          <FileText className="w-4 h-4 mr-2" />
          Crear Orden (Ingresar Vehículo)
        </Button>
      </div>
    </div>
  );
}
