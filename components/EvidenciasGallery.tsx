import React from 'react';
import { useState, useRef, useEffect } from "react";
import axios from "@/src/lib/api";
import { Camera, Image as ImageIcon, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export default function EvidenciasGallery({ entityId, entityType, categoria = "GENERAL", title = "Evidencias Fotográficas" }: { entityId: string, entityType: 'presupuesto' | 'orden', categoria?: string, title?: string }) {
  const [fotos, setFotos] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFotos = () => {
    axios.get(`/api/evidencias/${entityType}/${entityId}?categoria=${categoria}`).then(res => {
      if (Array.isArray(res.data)) {
        setFotos(res.data);
      }
    }).catch(console.error);
  };

  useEffect(() => {
    fetchFotos();
  }, [entityId, categoria]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("La imagen debe ser menor a 5MB");
      return;
    }

      if (file) {
        setIsUploading(true);
        try {
          const formData = new FormData();
          formData.append("file", file);
          if (file.name) formData.append("descripcion", file.name);
          if (entityType === 'presupuesto') formData.append("presupuestoId", entityId);
          if (entityType === 'orden') formData.append("ordenTrabajoId", entityId);
          formData.append("categoria", categoria);

          await axios.post("/api/evidencias", formData);
          fetchFotos();
        } catch (e) {
          alert("Error al subir foto");
        }
        setIsUploading(false);
      }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center text-slate-700">
          <Camera className="mr-2 h-4 w-4" /> {title}
        </h3>
        <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading} variant="outline" size="sm">
          <Upload className="mr-2 h-4 w-4" />
          {isUploading ? "Subiendo..." : "Subir Foto"}
        </Button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileChange} 
        />
      </div>

      {fotos.length === 0 ? (
        <div className="text-center p-8 border-2 border-dashed rounded-lg text-slate-500">
          <ImageIcon className="mx-auto h-8 w-8 mb-2 opacity-50" />
          <p>No hay fotos registradas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {fotos.map((f) => (
            <div key={f.id}><Dialog>
              <DialogTrigger render={
                <button type="button" className="aspect-square bg-slate-100 rounded-md overflow-hidden cursor-pointer border hover:border-indigo-500 transition-colors w-full p-0">
                  <img src={f.urlBase64} alt="Evidencia" className="w-full h-full object-cover" />
                </button>
              } />
              <DialogContent className="sm:max-w-3xl w-[95vw] border-0 p-0 overflow-hidden bg-transparent shadow-none">
                <img src={f.urlBase64} alt="Evidencia Ampliada" className="w-full h-auto max-h-[85vh] object-contain rounded-md" />
              </DialogContent>
            </Dialog></div>
          ))}
        </div>
      )}
    </div>
  );
}
