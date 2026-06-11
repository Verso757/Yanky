import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Camera, Image as ImageIcon, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export default function EvidenciasGallery({ entityId, entityType }: { entityId: string, entityType: 'presupuesto' | 'orden' }) {
  const [fotos, setFotos] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFotos = () => {
    axios.get(`/api/evidencias/${entityType}/${entityId}`).then(res => {
      if (Array.isArray(res.data)) {
        setFotos(res.data);
      }
    }).catch(console.error);
  };

  useEffect(() => {
    fetchFotos();
  }, [entityId]);

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

          await axios.post("/api/evidencias", formData, {
            headers: {
              "Content-Type": "multipart/form-data"
            }
          });
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
        <h3 className="text-lg font-semibold flex items-center">
          <Camera className="mr-2 h-5 w-5" /> Evidencias Fotográficas
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
            <Dialog key={f.id}>
              <DialogTrigger asChild>
                <div className="aspect-square bg-slate-100 rounded-md overflow-hidden cursor-pointer border hover:border-indigo-500 transition-colors">
                  <img src={f.urlBase64} alt="Evidencia" className="w-full h-full object-cover" />
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-3xl border-0 p-0 overflow-hidden bg-transparent shadow-none">
                <img src={f.urlBase64} alt="Evidencia Ampliada" className="w-full h-auto max-h-[85vh] object-contain rounded-md" />
              </DialogContent>
            </Dialog>
          ))}
        </div>
      )}
    </div>
  );
}
