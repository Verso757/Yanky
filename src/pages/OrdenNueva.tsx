import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Car, Contact2 } from "lucide-react";
import axios from "axios";

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
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Link to="/ordenes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nueva Orden de Trabajo</h1>
          <p className="text-sm text-slate-500">Ingreso de vehículo al taller o cotización</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos Principales</CardTitle>
          <CardDescription>Información del origen y clientes preexistentes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Origen de OT</Label>
              <Select value={origen} onValueChange={setOrigen}>
                <SelectTrigger>
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
              <Label>Cliente Existente</Label>
              <Select value={clienteId} onValueChange={handleClienteChange}>
                <SelectTrigger>
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
              <Label>Vehículo del Cliente</Label>
              <Select value={vehiculoId} onValueChange={setVehiculoId} disabled={!clienteId}>
                <SelectTrigger>
                  <SelectValue placeholder={clienteId ? "Seleccione el vehículo..." : "Primero seleccione un cliente"} />
                </SelectTrigger>
                <SelectContent>
                  {vehiculos.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.marca} {v.modelo} - Placas: {v.placas}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detalles del Servicio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label>Descripción del daño o servicio solicitado</Label>
              <Textarea 
                placeholder="Describa a detalle lo que se le hará al vehículo..." 
                className="min-h-[120px]"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Kilometraje de Ingreso (Opcional)</Label>
              <Input 
                type="number" 
                placeholder="Ej. 125000" 
                value={kilometraje}
                onChange={(e) => setKilometraje(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Monto Cotizado Base ($)</Label>
              <Input 
                type="number" 
                placeholder="Ej. 5000" 
                value={montoCotizado}
                onChange={(e) => setMontoCotizado(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Link to="/ordenes">
          <Button variant="outline">Cancelar</Button>
        </Link>
        <Button onClick={handleSave}>
          Crear Orden (Ingresar Vehículo)
        </Button>
      </div>
    </div>
  );
}
