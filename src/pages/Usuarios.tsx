import { useState, useEffect } from "react";
import axios from "@/src/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Pencil, Trash, UserCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Usuarios() {
  const { user: currentUser } = useAuth();
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    rol: "OPERADOR",
  });
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const roles = [
    { value: "ADMIN", label: "Administrador / Sistema" },
    { value: "JEFE", label: "Jefe de Taller" },
    { value: "RECEPCIONISTA", label: "Recepcionista" },
    { value: "TECNICO", label: "Técnico" },
    { value: "OPERADOR", label: "Operador" },
  ];

  const fetchUsuarios = async () => {
    try {
      const res = await axios.get("/api/usuarios");
      setUsuarios(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleCreateUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("/api/usuarios", formData);
      setIsAddOpen(false);
      setFormData({ nombre: "", email: "", password: "", rol: "OPERADOR" });
      fetchUsuarios();
    } catch (e) {
      console.error("Error creando usuario", e);
      alert("Error creando usuario, es posible que el email ya exista.");
    }
  };

  const handleUpdateUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data: any = { ...selectedUser };
      // Solo manda contraseña si se cambió
      if (!data.password) {
        delete data.password;
      }
      await axios.patch(`/api/usuarios/${selectedUser.id}`, data);
      setIsEditOpen(false);
      setSelectedUser(null);
      fetchUsuarios();
    } catch (e) {
      console.error("Error actualizando usuario", e);
    }
  };

  const handleChangeStatus = async (id: string, activo: boolean) => {
    if (window.confirm(`¿Estás seguro de ${activo ? 'reactivar' : 'desactivar'} este usuario?`)) {
      try {
        await axios.patch(`/api/usuarios/${id}`, { activo });
        fetchUsuarios();
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Usuarios y Accesos</h2>
          <p className="text-slate-500">Administra los roles y cuentas del personal.</p>
        </div>
        
        {currentUser?.rol === "ADMIN" && (
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger render={<Button className="bg-blue-600 hover:bg-blue-700" />}>
                <UserPlus className="h-4 w-4 mr-2" />
                Nuevo Usuario
              </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Registrar Nuevo Usuario</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateUsuario} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Nombre Completo</Label>
                  <Input 
                    required 
                    value={formData.nombre} 
                    onChange={e => setFormData({...formData, nombre: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input 
                    type="email" 
                    required 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contraseña</Label>
                  <Input 
                    type="password" 
                    required 
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rol</Label>
                  <Select value={formData.rol} onValueChange={(v) => setFormData({...formData, rol: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un rol" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map(r => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">Guardar Usuario</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-neutral-200 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-4">Usuario</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Rol</th>
                <th className="px-6 py-4">Status</th>
                {currentUser?.rol === "ADMIN" && <th className="px-6 py-4 text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Cargando usuarios...</td></tr>
              ) : usuarios.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No hay usuarios registrados</td></tr>
              ) : (
                usuarios.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                      <UserCircle className="w-8 h-8 text-slate-400" />
                      {u.nombre}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {u.rol}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${u.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    {currentUser?.rol === "ADMIN" && (
                      <td className="px-6 py-4 text-right">
                        <Dialog open={selectedUser?.id === u.id && isEditOpen} onOpenChange={(open) => {
                          setIsEditOpen(open);
                          if (!open) setSelectedUser(null);
                        }}>
                          <DialogTrigger render={<Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-slate-500 hover:text-blue-600 mr-2"
                              onClick={() => setSelectedUser({...u, password: ""})}
                            />}>
                              <Pencil className="w-4 h-4" />
                            </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Editar Usuario</DialogTitle>
                            </DialogHeader>
                            {selectedUser && (
                              <form onSubmit={handleUpdateUsuario} className="space-y-4 pt-4">
                                <div className="space-y-2">
                                  <Label>Nombre Completo</Label>
                                  <Input 
                                    required 
                                    value={selectedUser.nombre} 
                                    onChange={e => setSelectedUser({...selectedUser, nombre: e.target.value})} 
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Email</Label>
                                  <Input 
                                    type="email" 
                                    required 
                                    value={selectedUser.email} 
                                    onChange={e => setSelectedUser({...selectedUser, email: e.target.value})} 
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Nueva Contraseña <span className="text-xs text-slate-400">(Opcional)</span></Label>
                                  <Input 
                                    type="password" 
                                    value={selectedUser.password || ""} 
                                    onChange={e => setSelectedUser({...selectedUser, password: e.target.value})} 
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Rol</Label>
                                  <Select value={selectedUser.rol} onValueChange={(v) => setSelectedUser({...selectedUser, rol: v})}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecciona un rol" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {roles.map(r => (
                                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label>Status</Label>
                                  <Select 
                                    value={selectedUser.activo ? 'true' : 'false'} 
                                    onValueChange={(v) => setSelectedUser({...selectedUser, activo: v === 'true'})}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="true">Activo</SelectItem>
                                      <SelectItem value="false">Inactivo</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">Guardar Cambios</Button>
                              </form>
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={u.activo ? "text-slate-500 hover:text-red-600" : "text-emerald-600 hover:text-emerald-700"}
                          onClick={() => handleChangeStatus(u.id, !u.activo)}
                          title={u.activo ? "Desactivar" : "Reactivar"}
                        >
                          <Trash className={`w-4 h-4 ${!u.activo && 'rotate-180'}`} />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
