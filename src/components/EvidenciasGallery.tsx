import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Image as ImageIcon, Trash2, X, Plus } from "lucide-react";
import axios from "@/src/lib/api";

type EvidenciasGalleryProps = {
  entityId: string;
  entityType: "orden" | "presupuesto";
  categoria?: string;
  title?: string;
};

export default function EvidenciasGallery({ entityId, entityType, categoria = "GENERAL", title = "Evidencias" }: EvidenciasGalleryProps) {
  const [fotos, setFotos] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchFotos();
  }, [entityId, categoria]);

  const fetchFotos = async () => {
    try {
      const typePath = entityType === "orden" ? "orden" : "presupuesto";
      const res = await axios.get(`/api/evidencias/${typePath}/${entityId}?categoria=${categoria}`);
      setFotos(res.data || []);
    } catch (e) {
      console.error("Error al cargar fotos", e);
    }
  };

  const procesarArchivo = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          // Resize constraints
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Quality 0.7 for jpeg
          resolve(canvas.toDataURL("image/jpeg", 0.7));
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        // Reducir tamaño usando canvas para evitar limites de 1MB en Firestore base64
        const base64Str = await procesarArchivo(files[i]);
        
        // Convertir base64 escalado a file
        const byteString = atob(base64Str.split(",")[1]);
        const mimeString = base64Str.split(",")[0].split(":")[1].split(";")[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let j = 0; j < byteString.length; j++) ia[j] = byteString.charCodeAt(j);
        const blob = new Blob([ab], { type: mimeString });
        const smallFile = new File([blob], files[i].name, { type: mimeString });

        const formData = new FormData();
        formData.append("file", smallFile);
        if (entityType === "orden") formData.append("ordenTrabajoId", entityId);
        if (entityType === "presupuesto") formData.append("presupuestoId", entityId);
        formData.append("categoria", categoria);
        
        await axios.post("/api/evidencias", formData);
      }
      await fetchFotos();
    } catch(err) {
      console.error(err);
      alert("No se pudo subir la imagen");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const deleteFoto = async (id: string) => {
    if (!confirm("¿Eliminar esta foto?")) return;
    try {
      await axios.delete(`/api/evidencias/${id}`);
      fetchFotos();
    } catch (e) {
      console.error("Error al eliminar", e);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-700">{title}</h4>
        <input 
          type="file" 
          accept="image/*" 
          multiple 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
        />
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? <span className="animate-pulse">Subiendo...</span> : <><Camera className="w-4 h-4 mr-2" /> Agregar</>}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {fotos.map(f => (
          <div key={f.id} className="relative group rounded-md overflow-hidden border border-slate-200 aspect-square bg-slate-100 flex items-center justify-center">
            <img src={f.urlBase64} alt="Evidencia" className="object-cover w-full h-full" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => deleteFoto(f.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
        {fotos.length === 0 && (
          <div className="col-span-full py-8 text-center border-2 border-dashed border-slate-200 rounded-lg bg-slate-50 text-slate-500">
            <ImageIcon className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">No hay fotos en esta sección</p>
          </div>
        )}
      </div>
    </div>
  );
}
