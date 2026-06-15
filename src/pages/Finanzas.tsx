import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DollarSign, Plus, ArrowDown, ArrowUp, BriefcaseBusiness, CreditCard, Box, Users, Wallet } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import axios from "@/src/lib/api";
import { format } from "date-fns";

export default function Finanzas() {
  const [gastos, setGastos] = useState<any[]>([]);
  const [ordenesPagadas, setOrdenesPagadas] = useState<any[]>([]);
  const [ingresosTotales, setIngresosTotales] = useState(0);

  const [isGastoOpen, setIsGastoOpen] = useState(false);
  const [gastoData, setGastoData] = useState({
    fecha: new Date().toISOString().split("T")[0],
    descripcion: "",
    categoria: "Refacciones",
    metodoPago: "Efectivo",
    monto: ""
  });

  const fetchData = () => {
    // Gastos
    axios.get("/api/gastos").then((res) => {
      if (Array.isArray(res.data)) {
        setGastos(res.data);
      }
    }).catch(console.error);

    // Ingresos (Órdenes con montos cobrados)
    axios.get("/api/ordenes").then((res) => {
      if (Array.isArray(res.data)) {
        const pagadas = res.data.filter((o: any) => o.montoCobrado > 0);
        setOrdenesPagadas(pagadas);
        const ingresos = pagadas.reduce((acc: number, o: any) => acc + (o.montoCobrado || 0), 0);
        setIngresosTotales(ingresos);
      }
    }).catch(console.error);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalGastos = gastos.reduce((acc: number, g: any) => acc + g.monto, 0);
  const balance = ingresosTotales - totalGastos;

  const handleCargarGasto = async () => {
    if (!gastoData.descripcion || !gastoData.monto) {
      alert("Por favor completa los datos obligatorios.");
      return;
    }
    
    try {
      await axios.post("/api/gastos", gastoData);
      setIsGastoOpen(false);
      setGastoData({
        fecha: new Date().toISOString().split("T")[0],
        descripcion: "",
        categoria: "Refacciones",
        metodoPago: "Efectivo",
        monto: ""
      });
      fetchData();
    } catch (e) {
      alert("Error al registrar el gasto");
    }
  };

  const catIcon = (cat: string) => {
    switch (cat) {
      case 'Refacciones': return <Box className="w-4 h-4 mr-1 inline" />;
      case 'Nómina': return <Users className="w-4 h-4 mr-1 inline" />;
      case 'Servicios': return <BriefcaseBusiness className="w-4 h-4 mr-1 inline" />;
      default: return <Wallet className="w-4 h-4 mr-1 inline" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Finanzas</h1>
          <p className="text-sm text-slate-500">Control de ingresos, gastos y flujos operativos del taller</p>
        </div>
        <Dialog open={isGastoOpen} onOpenChange={setIsGastoOpen}>
          <DialogTrigger render={<Button className="bg-orange-600 hover:bg-orange-700 shadow-sm text-white" />}>
            <Plus className="mr-2 h-4 w-4" /> Registrar Gasto
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Nuevo Gasto</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input type="date" value={gastoData.fecha} onChange={e => setGastoData({...gastoData, fecha: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Concepto / Descripción *</Label>
                <Input placeholder="Ej. Filtros de aceite, Luz, Gasolina..." value={gastoData.descripcion} onChange={e => setGastoData({...gastoData, descripcion: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Monto ($) *</Label>
                  <Input type="number" step="0.01" min="0" placeholder="0.00" value={gastoData.monto} onChange={e => setGastoData({...gastoData, monto: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Método de Pago</Label>
                  <Select value={gastoData.metodoPago} onValueChange={v => setGastoData({...gastoData, metodoPago: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Efectivo">Efectivo</SelectItem>
                      <SelectItem value="Transferencia">Transferencia</SelectItem>
                      <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                      <SelectItem value="Crédito">Crédito a Proveedor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select value={gastoData.categoria} onValueChange={v => setGastoData({...gastoData, categoria: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Refacciones">Piezas y Refacciones</SelectItem>
                    <SelectItem value="Nómina">Nómina y Salarios</SelectItem>
                    <SelectItem value="Servicios">Servicios (Luz, Agua, Int.)</SelectItem>
                    <SelectItem value="Operación">Gastos Operativos Grales.</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCargarGasto} className="w-full mt-2 bg-orange-600 hover:bg-orange-700">Guardar Gasto</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-emerald-100 bg-emerald-50/10 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800">Ingresos Brutos (Cobrados)</CardTitle>
            <div className="p-2 bg-emerald-100 rounded-full">
              <ArrowUp className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">${ingresosTotales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-emerald-600/80 mt-1">Basado en cobros de Ordenes de Trabajo</p>
          </CardContent>
        </Card>

        <Card className="border-orange-100 bg-orange-50/10 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Gastos Registrados</CardTitle>
            <div className="p-2 bg-orange-100 rounded-full">
              <ArrowDown className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">${totalGastos.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-orange-600/80 mt-1">Basado en gastos capturados</p>
          </CardContent>
        </Card>

        <Card className={`${balance >= 0 ? 'border-blue-100 bg-blue-50/10' : 'border-red-100 bg-red-50/10'} shadow-sm`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${balance >= 0 ? 'text-blue-800' : 'text-red-800'}`}>Utilidad / Balance</CardTitle>
            <div className={`p-2 rounded-full ${balance >= 0 ? 'bg-blue-100' : 'bg-red-100'}`}>
              <DollarSign className={`h-4 w-4 ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
              ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className={`text-xs mt-1 ${balance >= 0 ? 'text-blue-600/80' : 'text-red-600/80'}`}>Flujo de caja estimado</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="gastos" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="gastos">Historial de Gastos</TabsTrigger>
          <TabsTrigger value="ingresos">Cobros Recientes (OTs)</TabsTrigger>
        </TabsList>
        
        <TabsContent value="gastos">
          <Card className="shadow-sm border-slate-200">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="w-[120px]">Fecha</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gastos.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell className="text-slate-500">{g.fecha ? format(new Date(g.fecha + 'T00:00:00'), "dd/MM/yyyy") : "--"}</TableCell>
                      <TableCell className="font-medium text-slate-900">{g.descripcion}</TableCell>
                      <TableCell>
                        <span className="flex items-center text-slate-600 text-sm">
                          {catIcon(g.categoria)}
                          {g.categoria}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-medium">{g.metodoPago}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-orange-600">-${g.monto.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    </TableRow>
                  ))}
                  {gastos.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                        <div className="flex flex-col items-center justify-center">
                          <Wallet className="w-8 h-8 text-slate-300 mb-2" />
                          <p>No hay gastos registrados en este periodo.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ingresos">
          <Card className="shadow-sm border-slate-200">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="w-[120px]">Fecha OT</TableHead>
                    <TableHead>Folio OT</TableHead>
                    <TableHead>Vehículo</TableHead>
                    <TableHead>Estado OT</TableHead>
                    <TableHead className="text-right">Monto Cobrado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordenesPagadas.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="text-slate-500">{o.createdAt ? format(new Date(o.createdAt), "dd/MM/yyyy") : "--"}</TableCell>
                      <TableCell className="font-bold text-indigo-600">{o.folio}</TableCell>
                      <TableCell className="font-medium text-slate-700">{o.vehiculo?.marca} {o.vehiculo?.modelo}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px]">{o.estado}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-emerald-600">+${(o.montoCobrado || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    </TableRow>
                  ))}
                  {ordenesPagadas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                        <div className="flex flex-col items-center justify-center">
                          <DollarSign className="w-8 h-8 text-slate-300 mb-2" />
                          <p>Aún no has registrado cobros en ninguna Orden de Trabajo.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

