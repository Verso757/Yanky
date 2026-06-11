import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, Phone, Mail, FileText } from "lucide-react";
import axios from "@/src/lib/api";

export default function Aseguradoras() {
  const [aseguradoras, setAseguradoras] = useState<any[]>([]);

  useEffect(() => {
    axios.get("/api/aseguradoras").then((res) => {
      if (Array.isArray(res.data)) {
        setAseguradoras(res.data);
      }
    }).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Aseguradoras</h1>
          <p className="text-sm text-slate-500">Gestión de seguros, contactos y cuentas por cobrar</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {aseguradoras.map((a) => {
          const otsActivas = a.ots || [];
          const cotizacionesPendientes = otsActivas.filter((o: any) => o.origen === "SEGURO_FLUJO_B");
          
          const porCobrar = otsActivas.reduce((acc: number, o: any) => acc + (o.montoCotizado - o.montoCobrado), 0);

          return (
            <Card key={a.id}>
              <CardHeader className="pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-indigo-500" />
                    {a.nombre}
                  </CardTitle>
                </div>
                {a.ejecutivoNombre && (
                  <CardDescription className="flex items-center mt-1 text-slate-600">
                     <span className="font-medium mr-2">{a.ejecutivoNombre}</span>
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="pt-4 grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  {a.telefono && (
                    <div className="flex items-center text-sm text-slate-600">
                      <Phone className="w-4 h-4 mr-2 text-slate-400" />
                      {a.telefono}
                    </div>
                  )}
                  {a.email && (
                    <div className="flex items-center text-sm text-slate-600">
                      <Mail className="w-4 h-4 mr-2 text-slate-400" />
                      {a.email}
                    </div>
                  )}
                  {a.condicionesPago && (
                    <div className="flex items-center text-sm text-slate-600">
                      <FileText className="w-4 h-4 mr-2 text-slate-400" />
                      Pago a {a.condicionesPago}
                    </div>
                  )}
                </div>
                
                <div className="space-y-4 rounded-md bg-slate-50 p-3">
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">OTs Activas</p>
                    <p className="text-lg font-bold text-slate-900">{otsActivas.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Por Cobrar</p>
                    <p className="text-lg font-bold text-orange-600">${porCobrar.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {aseguradoras.length === 0 && (
          <div className="col-span-full py-12 text-center border rounded-lg bg-white border-dashed">
            <p className="text-slate-500">No hay aseguradoras registradas.</p>
          </div>
        )}
      </div>
    </div>
  );
}
